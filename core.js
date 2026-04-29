// --- НАСТРОЙКИ ---
const APP_CONFIG = {
    defaults: {
        multisport: 160.21,    // Цена мультиспорта
        lunch: 800.00          // Обеды
    },
    labels: {
        base: "Base Amount (USD)",
        bonusUsd: "Bonus (USD)",
        bonusPln: "Bonus (PLN)",
        multisport: "Multisport Benefit",
        lunch: "Lunch Allowance"
    }
};

const core = {
    state: { ...APP_CONFIG.defaults },
    currentTotal: 0, 

    init() {
        const saved = localStorage.getItem('b2b_reward_settings');
        // Загружаем только те настройки, которые реально нужны
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.multisport) this.state.multisport = parsed.multisport;
            if (parsed.lunch) this.state.lunch = parsed.lunch;
        }
        
        // Устанавливаем сегодняшнюю дату по умолчанию
        document.getElementById('ui-invoice-date').valueAsDate = new Date();
        this.updateUI();
    },

    updateUI() {
        // Больше никакого exchangeRate здесь нет, скрипт не сломается!
        document.getElementById('val-multisport').textContent = this.state.multisport.toFixed(2) + ' PLN';
        document.getElementById('val-lunch').textContent = this.state.lunch.toFixed(2) + ' PLN';
    },

    toggleEdit(key) {
        const el = document.getElementById(`edit-${key}`);
        if (!el) return; // Защита от ошибок
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

    async fetchNBPRate(dateStr) {
        const invoiceDate = new Date(dateStr);
        if (isNaN(invoiceDate)) return null;

        const endDate = new Date(invoiceDate);
        endDate.setDate(endDate.getDate() - 1);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);

        const formatDate = (d) => d.toISOString().split('T')[0];

        try {
            const url = `https://api.nbp.pl/api/exchangerates/rates/a/usd/${formatDate(startDate)}/${formatDate(endDate)}/?format=json`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                const lastRate = data.rates[data.rates.length - 1];
                return { rate: lastRate.mid, date: lastRate.effectiveDate };
            }
        } catch (error) {
            console.warn('Ошибка при получении курса NBP:', error);
        }
        return null;
    },

    async calculate() {
        const btn = document.getElementById('calculate-btn');
        btn.textContent = 'Calculating...';
        btn.disabled = true;

        const dateInput = document.getElementById('ui-invoice-date').value;
        const baseUsd = parseFloat(document.getElementById('ui-usd-base').value) || 0;
        const bonusUsd = parseFloat(document.getElementById('ui-usd-bonus').value) || 0;
        const bonusPln = parseFloat(document.getElementById('ui-pln-bonus').value) || 0;
        const hasMultisport = document.getElementById('ui-check-multisport').checked;
        const hasLunch = document.getElementById('ui-check-lunch').checked;

        let activeRate = 4.0; // Резервный курс на случай, если API NBP упадет
        let rateSourceLabel = 'Fallback Rate';

        if (dateInput) {
            const nbpData = await this.fetchNBPRate(dateInput);
            if (nbpData) {
                activeRate = nbpData.rate;
                rateSourceLabel = `NBP from ${nbpData.date}`;
            } else {
                alert("Не удалось получить курс NBP (возможно ошибка сети). Используется резервный курс.");
            }
        } else {
            alert("Пожалуйста, выберите дату инвойса!");
            btn.textContent = 'Calculate Total Reward';
            btn.disabled = false;
            return;
        }

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

        addRow(`${APP_CONFIG.labels.base} (×${activeRate.toFixed(4)} [${rateSourceLabel}])`, baseUsd * activeRate);
        addRow(`${APP_CONFIG.labels.bonusUsd} (×${activeRate.toFixed(4)})`, bonusUsd * activeRate);
        addRow(APP_CONFIG.labels.bonusPln, bonusPln);
        if (hasMultisport) addRow(APP_CONFIG.labels.multisport, this.state.multisport);
        if (hasLunch) addRow(APP_CONFIG.labels.lunch, this.state.lunch);

        this.currentTotal = total; 
        document.getElementById('ui-total-value').textContent = total.toFixed(2) + ' PLN';
        document.getElementById('ui-total-value').style.color = total < 0 ? '#d32f2f' : '#8e2de2';
        document.getElementById('ui-result-box').style.display = 'block';

        btn.textContent = 'Calculate Total Reward';
        btn.disabled = false;
    },

    copyTotal() {
        if (this.currentTotal !== undefined) {
            navigator.clipboard.writeText(this.currentTotal.toFixed(2)).then(() => {
                const btn = document.getElementById('copy-btn');
                const originalText = btn.textContent;
                btn.textContent = '✅ Copied!';
                btn.style.background = '#1b5e20';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '#8e2de2';
                }, 2000);
            });
        }
    }
};

core.init();
