
function initUnitConverter() {
    // 1. DOM Elements
    const categorySelect = document.getElementById('category-select');
    const fromValueInput = document.getElementById('from-value');
    const fromUnitSelect = document.getElementById('from-unit');
    const toValueInput = document.getElementById('to-value');
    const toUnitSelect = document.getElementById('to-unit');

    // 2. Data
    const units = {
        length: {
            '미터 (m)': 1,
            '킬로미터 (km)': 1000,
            '센티미터 (cm)': 0.01,
            '밀리미터 (mm)': 0.001,
            '마일 (mi)': 1609.34,
            '야드 (yd)': 0.9144,
            '피트 (ft)': 0.3048,
            '인치 (in)': 0.0254
        },
        weight: {
            '그램 (g)': 1,
            '킬로그램 (kg)': 1000,
            '밀리그램 (mg)': 0.001,
            '톤 (t)': 1000000,
            '파운드 (lb)': 453.592,
            '온스 (oz)': 28.3495
        },
        temperature: {
            '섭씨 (°C)': { toBase: c => c + 273.15, fromBase: k => k - 273.15 },
            '화씨 (°F)': { toBase: f => (f - 32) * 5/9 + 273.15, fromBase: k => (k - 273.15) * 9/5 + 32 },
            '켈빈 (K)': { toBase: k => k, fromBase: k => k }
        },
        volume: {
            '리터 (L)': 1,
            '밀리리터 (mL)': 0.001,
            '세제곱미터 (m³)': 1000,
            '갤런 (gal)': 3.78541,
            '온스 (fl oz)': 0.0295735
        }
    };

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

initUnitConverter();
