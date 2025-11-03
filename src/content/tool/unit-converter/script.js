
export function init() {
    // 1. DOM Elements
    const categorySelect = document.getElementById('category-select');
    const fromValueInput = document.getElementById('from-value');
    const fromUnitSelect = document.getElementById('from-unit');
    const toValueInput = document.getElementById('to-value');
    const toUnitSelect = document.getElementById('to-unit');
    const i18nData = document.getElementById('i18n-data');

    // 2. Data
    const baseUnits = {
        length: {
            meter: 1,
            kilometer: 1000,
            centimeter: 0.01,
            millimeter: 0.001,
            mile: 1609.34,
            yard: 0.9144,
            foot: 0.3048,
            inch: 0.0254
        },
        weight: {
            gram: 1,
            kilogram: 1000,
            milligram: 0.001,
            ton: 1000000,
            pound: 453.592,
            ounce: 28.3495
        },
        temperature: {
            celsius: { toBase: c => c + 273.15, fromBase: k => k - 273.15 },
            fahrenheit: { toBase: f => (f - 32) * 5/9 + 273.15, fromBase: k => (k - 273.15) * 9/5 + 32 },
            kelvin: { toBase: k => k, fromBase: k => k }
        },
        volume: {
            liter: 1,
            milliliter: 0.001,
            cubic_meter: 1000,
            gallon: 3.78541,
            fluid_ounce: 0.0295735
        }
    };

    const translatedUnits = JSON.parse(i18nData.dataset.units);

    const units = {};
    for (const category in baseUnits) {
        units[category] = {};
        for (const unitKey in baseUnits[category]) {
            const translatedName = translatedUnits[unitKey];
            units[category][translatedName] = baseUnits[category][unitKey];
        }
    }

    // 3. Event Listeners
    categorySelect.addEventListener('change', populateUnits);
    fromValueInput.addEventListener('input', convert);
    fromUnitSelect.addEventListener('change', convert);
    toUnitSelect.addEventListener('change', convert);

    // 4. Functions
    function populateUnits() {
        const category = categorySelect.value;
        const unitKeys = Object.keys(units[category]);

        fromUnitSelect.innerHTML = '';
        toUnitSelect.innerHTML = '';

        unitKeys.forEach(unit => {
            fromUnitSelect.add(new Option(unit, unit));
            toUnitSelect.add(new Option(unit, unit));
        });

        fromUnitSelect.selectedIndex = 0;
        toUnitSelect.selectedIndex = 1;
        convert();
    }

    function convert() {
        const fromValue = parseFloat(fromValueInput.value);
        const fromUnit = fromUnitSelect.value;
        const toUnit = toUnitSelect.value;
        const category = categorySelect.value;

        if (isNaN(fromValue)) {
            toValueInput.value = '';
            return;
        }

        let baseValue;
        if (category === 'temperature') {
            baseValue = units[category][fromUnit].toBase(fromValue);
        } else {
            baseValue = fromValue * units[category][fromUnit];
        }

        let finalValue;
        if (category === 'temperature') {
            finalValue = units[category][toUnit].fromBase(baseValue);
        } else {
            finalValue = baseValue / units[category][toUnit];
        }

        toValueInput.value = finalValue.toFixed(5);
    }

    // Initial setup
    populateUnits();
}
