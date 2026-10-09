document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('selector-form');
  const result = document.getElementById('result');
  const placeholder = document.getElementById('placeholder');

  if (!form || !result || !placeholder) return;

  const getNumber = (data, name) => Number(data.get(name) || 0);
  const getOptionalNumber = (data, name) => {
    const value = data.get(name);
    return value === null || value === '' ? null : Number(value);
  };
  const checked = (data, name) => data.get(name) === 'on';
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  function evaluateSelection(data) {
    const service = data.get('service');
    const installation = data.get('installation');
    const declaredFlammability = data.get('flammability');
    const flow = getNumber(data, 'flow');
    const head = getNumber(data, 'head');
    const suctionLift = getNumber(data, 'lift');
    const suctionPressure = getNumber(data, 'ps');
    const dischargePressure = getNumber(data, 'pd');
    const minimumTemperature = getNumber(data, 'tmin');
    const maximumTemperature = getNumber(data, 'tmax');
    const vaporPressure = getNumber(data, 'vp');
    const driverPower = getNumber(data, 'power');
    const flashPoint = getOptionalNumber(data, 'flashPoint');
    const gasoline = data.get('gasoline');
    const h2s = getNumber(data, 'h2s');
    const autoIgnitionTemperature = getOptionalNumber(data, 'ait');
    const solids = getNumber(data, 'solids');
    const viscosity = getNumber(data, 'viscosity');
    const aromatics = getNumber(data, 'aromatics');
    const benzene = getNumber(data, 'benzene');
    const npsha120 = getOptionalNumber(data, 'npsha120');
    const npsh3Rated = getOptionalNumber(data, 'npsh3Rated');
    const npsh3120 = getOptionalNumber(data, 'npsh3120');

    const derivedFlammable = flashPoint !== null &&
      (flashPoint <= 54 || maximumTemperature >= flashPoint - 8);
    const flammable = declaredFlammability === 'flammable' || derivedFlammable;
    const nonFlammable = declaredFlammability === 'nonflammable' && !derivedFlammable;

    const aromaticTrigger = gasoline === 'no' && aromatics > 25;
    const benzeneTrigger =
      (gasoline === 'no' && benzene > 1) ||
      (gasoline === 'yes' && benzene > 5);
    const h2sTrigger = service !== 'lean_amine' && h2s > 500;
    const autoIgnitionTrigger = autoIgnitionTemperature !== null &&
      maximumTemperature > autoIgnitionTemperature;
    const api682Trigger = data.get('api682') === 'arr3';
    const licensorTrigger = ['sealless', 'arr3'].includes(data.get('licensor'));
    const automaticChemicalTrigger = ['acid', 'caustic', 'hypo'].includes(service);
    const consequenceTrigger = ['personnel', 'environment', 'fire'].includes(data.get('leak'));

    const confirmedHazard =
      data.get('projectClass') === 'confirmed' ||
      automaticChemicalTrigger || aromaticTrigger || benzeneTrigger ||
      h2sTrigger || autoIgnitionTrigger || api682Trigger ||
      licensorTrigger || consequenceTrigger;

    const incompleteHazardData =
      data.get('projectClass') === 'unknown' ||
      data.get('toxicity') === 'unknown' ||
      data.get('leak') === 'unknown' ||
      data.get('api682') === 'unknown' ||
      data.get('licensor') === 'unknown' ||
      declaredFlammability === 'unknown';

    const potentialHazard = !confirmedHazard && (
      data.get('projectClass') === 'potential' ||
      data.get('toxicity') === 'toxic' ||
      incompleteHazardData
    );

    const verticalRequired =
      checked(data, 'horizontalProhibited') || checked(data, 'spaceLimited');

    const generalAsmeEligible =
      dischargePressure <= 1900 && suctionPressure <= 520 &&
      minimumTemperature >= 0 && maximumTemperature <= 120 &&
      vaporPressure < 207 && driverPower <= 112;

    const hydrocarbonAsmeEligible =
      dischargePressure <= 1900 && suctionPressure <= 520 &&
      minimumTemperature >= 0 && maximumTemperature <= 65 &&
      vaporPressure < 172 && driverPower <= 112;

    const apiRequired = checked(data, 'betweenBearing') ||
      (service === 'hydrocarbon' ? !hydrocarbonAsmeEligible : !generalAsmeEligible);

    let family = '';
    let pumpType = '';
    let configuration = '';
    let standard = '';
    const basis = [];
    const checks = [];
    const warnings = [];

    // Pump hydraulic arrangement is always selected first. Hazard uncertainty no longer suppresses it.
    if (service === 'storm') {
      family = 'Storm-water sump pump';
      pumpType = 'Vertical suspended centrifugal pump';
      configuration = 'Discharge-through-column arrangement, typically API 610 VS1 or VS2';
      standard = driverPower < 225
        ? 'Vendor standard design meeting SAES-G-005 requirements'
        : 'API 610 / 31-SAMSS-004';
      basis.push('Storm-water sump applications use a vertical suspended discharge-through-column arrangement.');
    } else if (service === 'oily_sump' && installation === 'open_sump') {
      const vendorSelfPrimingFeasible = checked(data, 'selfPriming');
      const horizontalSelfPrimingAllowed =
        nonFlammable && suctionLift <= 6 &&
        vendorSelfPrimingFeasible && !verticalRequired;

      family = 'Oily-water open-sump pump';

      if (horizontalSelfPrimingAllowed) {
        pumpType = 'Horizontal self-priming centrifugal pump';
        configuration = 'Direct-drive, integral one-piece priming chamber';
        standard = 'Vendor standard design plus SAES-G-005 self-priming requirements';
        basis.push(
          'The liquid is non-flammable.',
          'Suction lift does not exceed 6 m.',
          'Horizontal installation is feasible.',
          'Vendor flow, discharge-pressure and NPSH operating-range feasibility is confirmed.'
        );
        checks.push('Confirm the external-water priming system, solenoid valve and startup permissive.');
        if (checked(data, 'pressurizedDischarge')) {
          checks.push('Provide an automatic air-release valve or continuous bleed with orifice upstream of the discharge check valve.');
        }
        if (checked(data, 'extendedStandby')) {
          checks.push('Provide continuous priming provisions for extended standby.');
        }
        if (checked(data, 'frequentDuty')) {
          checks.push('Provide the required operating-to-standby priming connection upstream of the check valves.');
        }
        if (!checked(data, 'integralChamber')) {
          warnings.push('Integral one-piece priming chamber has not been confirmed.');
        }
        if (!checked(data, 'externalWaterPriming')) {
          warnings.push('External-water priming permissive and solenoid arrangement has not been confirmed.');
        }
      } else {
        pumpType = 'Vertical suspended centrifugal pump';
        configuration = 'Discharge-through-column arrangement, API 610 VS1 or VS2';
        standard = 'API 610 / 31-SAMSS-004';
        if (flammable) basis.push('Flammable oily-water service excludes the horizontal self-priming branch.');
        if (suctionLift > 6) basis.push('Suction lift exceeds 6 m.');
        if (!vendorSelfPrimingFeasible) basis.push('Self-priming flow, pressure or NPSH feasibility is not confirmed.');
        if (verticalRequired) basis.push('Suction conditions or space prohibit a horizontal pump.');
        if (declaredFlammability === 'unknown') basis.push('Flammability is not confirmed, so the horizontal exception cannot be applied.');
        checks.push('Do not use VS4 or VS5 separate-discharge arrangements for hydrocarbon or oily-water open-sump service.');
      }
    } else if (service === 'firewater') {
      family = 'Main firewater pump';
      pumpType = verticalRequired ? 'Vertical suspended firewater pump' : 'Horizontal firewater pump';
      configuration = verticalRequired ? 'Vertical turbine/suspended arrangement' : 'Horizontal split-case or approved NFPA 20 arrangement';
      standard = 'NFPA 20 plus applicable project firewater requirements';
    } else if (service === 'jockey') {
      family = 'Firewater jockey pump';
      pumpType = verticalRequired ? 'Vertical in-line or suspended jockey pump' : 'Horizontal end-suction jockey pump';
      configuration = verticalRequired ? 'Vertical compact arrangement' : 'Horizontal overhung arrangement';
      standard = verticalRequired ? 'ASME B73.2 or ISO 5199' : 'ASME B73.1 or ISO 2858 + ISO 5199';
    } else if (installation === 'open_sump') {
      family = 'Open-sump service pump';
      pumpType = verticalRequired ? 'Vertical suspended centrifugal pump' : 'Service-specific centrifugal pump';
      configuration = verticalRequired ? 'Vertical suspended arrangement' : 'Final arrangement requires service-specific project review';
      standard = apiRequired ? 'API 610 / 31-SAMSS-004' : 'Project-approved vendor standard meeting SAES-G-005';
      warnings.push('The horizontal self-priming mandate is restricted to qualifying oily-water open-sump service and is not applied automatically to every open sump.');
    } else if (service === 'sewage' && driverPower <= 37) {
      family = 'Domestic sewage or community-water pump';
      pumpType = verticalRequired ? 'Vertical sewage pump' : 'Horizontal sewage centrifugal pump';
      configuration = 'Manufacturer-standard sewage-service arrangement';
      standard = 'Manufacturer standard design within the SAES-G-005 scope exception';
    } else if (apiRequired) {
      family = 'API process centrifugal pump';
      if (checked(data, 'betweenBearing')) {
        pumpType = 'Between-bearing centrifugal pump';
        configuration = 'Preliminary API 610 BB-family arrangement; final BB type requires hydraulic and pressure review';
      } else if (verticalRequired) {
        pumpType = 'Vertical process centrifugal pump';
        configuration = 'Vertical in-line or suspended API arrangement, subject to suction-source review';
      } else {
        pumpType = 'Horizontal API process pump';
        configuration = 'Preliminary overhung horizontal arrangement, subject to vendor curve and power limits';
      }
      standard = 'API 610 / 31-SAMSS-004';
    } else {
      family = 'General process centrifugal pump';
      pumpType = verticalRequired ? 'Vertical in-line centrifugal pump' : 'Horizontal end-suction centrifugal pump';
      configuration = verticalRequired ? 'Vertical in-line chemical-process arrangement' : 'Horizontal overhung end-suction arrangement';
      standard = verticalRequired ? 'ASME B73.2 or ISO 5199' : 'ASME B73.1 or ISO 2858 + ISO 5199';
    }

    // Containment requirement is evaluated separately and never removes pump type/standard.
    let containment = 'Normal seal selection review required';
    if (confirmedHazard) {
      const seallessFeasible =
        driverPower <= 225 && solids <= 0.25 &&
        viscosity >= 0.3 && viscosity <= 200 &&
        !(checked(data, 'magneticParticles') && !checked(data, 'magneticControl')) &&
        !checked(data, 'crystallizing') && !checked(data, 'poorLubricity');

      if (data.get('licensor') === 'arr3' || data.get('api682') === 'arr3' || !seallessFeasible) {
        containment = 'Dual pressurized mechanical seals, API 682 Arrangement 3, subject to specialist confirmation';
      } else {
        containment = 'Sealless construction may be considered, subject to API 685 / ASME B73.3 / ISO 15783 feasibility review';
      }
    } else if (potentialHazard) {
      containment = 'Containment not finalized: Process, HSE, Materials and Pump Specialist confirmation required';
      warnings.push('Appendix D or containment information is incomplete or potentially hazardous. The hydraulic pump type and governing construction standard are still shown provisionally.');
    }

    if (declaredFlammability === 'nonflammable' && derivedFlammable) {
      warnings.push('Declared non-flammable status conflicts with flash-point and pumping-temperature screening. Treat as flammable until confirmed.');
    }

    checks.push('Confirm normal and rated duty relative to BEP, POR/AOR and minimum continuous stable flow.');
    checks.push('Complete materials, corrosion, shaft-seal and secondary-containment review.');
    checks.push('Determine NPSHA at 120% rated flow using minimum suction pressure, vapor pressure at maximum pumping temperature and permanent-strainer pressure drop.');

    if (npsha120 !== null && npsh3Rated !== null && npsha120 - npsh3Rated < 1) {
      warnings.push('Entered NPSH margin at rated flow is below 1 m.');
    }
    if (npsha120 !== null && npsh3120 !== null && npsh3120 > npsha120) {
      warnings.push('Vendor NPSH3 at 120% rated flow exceeds the entered NPSHA at 120% rated flow.');
    }
    if (data.get('strainerIncluded') === 'no' || data.get('strainerIncluded') === 'unknown') {
      warnings.push('Permanent-strainer pressure drop is not confirmed in the NPSHA calculation.');
    }
    if (checked(data, 'parallel')) {
      checks.push('Verify matched parallel curves, shutoff heads and stable combined operation.');
    }

    return {
      hazard: confirmedHazard ? 'confirmed' : potentialHazard ? 'potential' : 'normal',
      family, pumpType, configuration, standard, containment,
      basis, checks, warnings,
      duty: { flow, head, driverPower }
    };
  }

  function render(selection) {
    const hazardText = selection.hazard === 'confirmed'
      ? 'Appendix D screening: highly hazardous'
      : selection.hazard === 'potential'
        ? 'Appendix D screening: specialist confirmation required'
        : 'Appendix D screening: no trigger entered';

    result.innerHTML = `
      <p class="kicker">Preliminary recommendation</p>
      <div class="status ${selection.hazard}">${escapeHTML(hazardText)}</div>
      <h2>${escapeHTML(selection.family)}</h2>
      <div class="decision"><span>Pump type</span><strong>${escapeHTML(selection.pumpType)}</strong></div>
      <div class="decision"><span>Configuration</span><strong>${escapeHTML(selection.configuration)}</strong></div>
      <div class="standard"><span>Governing construction standard</span><br><strong>${escapeHTML(selection.standard)}</strong></div>
      <div class="decision"><span>Containment / sealing status</span><strong>${escapeHTML(selection.containment)}</strong></div>
      <div class="result-section"><h3>Selection basis</h3><ul>${selection.basis.map((item) => `<li>${escapeHTML(item)}</li>`).join('') || '<li>Normal Appendix A screening branch applied.</li>'}</ul></div>
      <div class="result-section"><h3>Mandatory next checks</h3><ul>${selection.checks.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul></div>
      ${selection.warnings.map((item) => `<div class="warning">${escapeHTML(item)}</div>`).join('')}
      <button type="button" class="print" onclick="window.print()">Print / Save report</button>`;

    placeholder.hidden = true;
    result.hidden = false;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    render(evaluateSelection(new FormData(form)));
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  form.addEventListener('reset', () => setTimeout(() => {
    result.hidden = true;
    placeholder.hidden = false;
  }, 0));
});
