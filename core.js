const core = {
    state: { ...APP_CONFIG.defaults },

    init() {
        const saved = localStorage.getItem('b2b_reward_settings');
        if (saved) this.state = { ...this.state, ...JSON.parse(saved) };
        this.updateUI();
    },

    updateUI() {
        document.getElementById('val-exchangeRate').textContent = this.state.exchangeRate;
        document.getElementById('val-multisport').textContent = this.state.multisport.toFixed(2) + ' PLN';
        document.getElementById('val-lunch').textContent = this.state.lunch.toFixed(2) + ' PLN';
    },

    toggleEdit(key) {
        const el = document.getElementById(`edit-${key}`);
        el.style.display = el.style.display === 'block' ? 'none' : 'block';
        if (el.style.display === 'block') document.getElementById(`input-${key}`).value = this.state[key];
    },

    save(key) {
        const val = parseFloat(document.getElementById(`input-${key}`).value);
        if (!isNaN(val) && val >= 0) {
            this.state[key] = val;
            localStorage.setItem('b2b_reward_settings', JSON.stringify(this.state));
            this.updateUI();
            this.toggleEdit(key);
        }
    },

    reset() {
        if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
            this.state = { ...APP_CONFIG.defaults };
            localStorage.removeItem('b2b_reward_settings');
            this.updateUI();
        }
    },

    calculate() {
        const baseUsd = parseFloat(document.getElementById('ui-usd-base').value) || 0;
        const bonusUsd = parseFloat(document.getElementById('ui-usd-bonus').value) || 0;
        const bonusPln = parseFloat(document.getElementById('ui-pln-bonus').value) || 0;
        const hasMultisport = document.getElementById('ui-check-multisport').checked;
        const hasLunch = document.getElementById('ui-check-lunch').checked;

        const list = document.getElementById('ui-details-list');
        list.innerHTML = '';
        let total = 0;

        const addRow = (label, amount) => {
            if (amount === 0) return;
            const li = document.createElement('li');
            li.innerHTML = `<span>${label}</span><span>${amount.toFixed(2)} PLN</span>`;
            if (amount < 0) li.style.color = '#d32f2f';
            list.appendChild(li);
            total += amount;
        };

        addRow(`${APP_CONFIG.labels.base} (×${this.state.exchangeRate})`, baseUsd * this.state.exchangeRate);
        addRow(`${APP_CONFIG.labels.bonusUsd} (×${this.state.exchangeRate})`, bonusUsd * this.state.exchangeRate);
        addRow(APP_CONFIG.labels.bonusPln, bonusPln);
        if (hasMultisport) addRow(APP_CONFIG.labels.multisport, this.state.multisport);
        if (hasLunch) addRow(APP_CONFIG.labels.lunch, this.state.lunch);

        document.getElementById('ui-total-value').textContent = total.toFixed(2) + ' PLN';
        document.getElementById('ui-total-value').style.color = total < 0 ? '#d32f2f' : '#1b5e20';
        document.getElementById('ui-result-box').style.display = 'block';
    }
};

core.init();
