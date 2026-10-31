// State Management
let transactions = [];
let monthlyIncome = 0;
let monthlyExpense = 0;
let spendingLimit = null;

// DOM Elements
const totalBalanceEl = document.getElementById('totalBalance');
const transactionForm = document.getElementById('transactionForm');
const transactionListEl = document.getElementById('transactionList');
const expenseChart = document.getElementById('expenseChart');
const monthlyIncomeEl = document.getElementById('monthlyIncome');
const monthlyExpenseEl = document.getElementById('monthlyExpense');
const transactionCountEl = document.getElementById('transactionCount');
const limitAmountInput = document.getElementById('limitAmount');
const setLimitBtn = document.getElementById('setLimitBtn');
const limitAmountDisplay = document.getElementById('limitAmountDisplay');
const limitDisplay = document.getElementById('limitDisplay');
const progressFill = document.getElementById('progressFill');
const limitStatus = document.getElementById('limitStatus');
const darkModeToggle = document.getElementById('darkModeToggle');
const sortOrder = document.getElementById('sortOrder');

// Initialize
loadFromLocalStorage();
updateUI();

// Event Listeners
transactionForm.addEventListener('submit', handleFormSubmit);
sortOrder.addEventListener('change', updateTransactionList);
setLimitBtn.addEventListener('click', setSpendingLimit);
darkModeToggle.addEventListener('click', toggleDarkMode);

// Load data from localStorage
function loadFromLocalStorage() {
    const storedTransactions = localStorage.getItem('transactions');
    const storedLimit = localStorage.getItem('spendingLimit');
    
    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    }
    
    if (storedLimit) {
        spendingLimit = parseFloat(storedLimit);
    }
}

// Save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    if (spendingLimit !== null) {
        localStorage.setItem('spendingLimit', spendingLimit.toString());
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Calculate totals
function calculateTotals() {
    monthlyIncome = 0;
    monthlyExpense = 0;
    
    transactions.forEach(trans => {
        if (trans.amount >= 0) {
            monthlyIncome += trans.amount;
        } else {
            monthlyExpense += Math.abs(trans.amount);
        }
    });
}

// Calculate balance
function calculateBalance() {
    return monthlyIncome - monthlyExpense;
}

// Get current month transactions
function getCurrentMonthTransactions() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions.filter(trans => {
        const transDate = new Date(trans.date);
        return transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear;
    });
}

// Get expense by category
function getExpensesByCategory() {
    const categoryTotals = {};
    const currentMonthTrans = getCurrentMonthTransactions();
    
    currentMonthTrans.forEach(trans => {
        if (trans.amount < 0) {
            const category = trans.category;
            if (!categoryTotals[category]) {
                categoryTotals[category] = 0;
            }
            categoryTotals[category] += Math.abs(trans.amount);
        }
    });
    
    return categoryTotals;
}

// Draw pie chart using Canvas
function drawPieChart() {
    const ctx = expenseChart.getContext('2d');
    const width = expenseChart.width;
    const height = expenseChart.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    const expenses = getExpensesByCategory();
    const categories = Object.keys(expenses);
    const values = Object.values(expenses);
    
    if (values.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Belum ada pengeluaran untuk bulan ini', centerX, centerY);
        return;
    }
    
    const total = values.reduce((sum, val) => sum + val, 0);
    let startAngle = -Math.PI / 2;
    
    const colors = {
        'Makanan': '#FF6384',
        'Transportasi': '#36A2EB',
        'Hiburan': '#FFCE56',
        'Lainnya': '#4CAF50'
    };
    
    categories.forEach((category, index) => {
        const value = values[index];
        const percentage = value / total;
        const sliceAngle = percentage * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        
        ctx.fillStyle = colors[category] || '#999';
        ctx.fill();
        
        // Draw text label
        const labelAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 0.7;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${category} (${Math.round(percentage * 100)}%)`, labelX, labelY);
        
        startAngle += sliceAngle;
    });
    
    // Draw legend
    let legendX = 20;
    let legendY = 20;
    
    categories.forEach((category, index) => {
        ctx.fillStyle = colors[category] || '#999';
        ctx.fillRect(legendX, legendY, 15, 15);
        
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`${category}: ${formatCurrency(values[index])}`, legendX + 20, legendY + 2);
        
        legendY += 30;
        
        if (legendY > height - 30) {
            legendY = 20;
            legendX += 200;
        }
    });
}

// Update UI
function updateUI() {
    calculateTotals();
    const balance = calculateBalance();
    
    // Update balance
    totalBalanceEl.textContent = formatCurrency(balance);
    totalBalanceEl.style.color = balance >= 0 ? '#4caf50' : '#e94560';
    
    // Update monthly summary
    monthlyIncomeEl.textContent = formatCurrency(monthlyIncome);
    monthlyExpenseEl.textContent = formatCurrency(monthlyExpense);
    transactionCountEl.textContent = transactions.length;
    
    // Update transaction list
    updateTransactionList();
    
    // Update chart
    drawPieChart();
    
    // Update spending limit display
    updateSpendingLimitDisplay();
    
    // Save to localStorage
    saveToLocalStorage();
}

// Handle form submit
function handleFormSubmit(e) {
    e.preventDefault();
    
    const itemName = document.getElementById('itemName').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    
    if (!itemName || !amount || !category) {
        alert('Semua kolom harus diisi!');
        return;
    }
    
    const newTransaction = {
        id: Date.now(),
        itemName,
        amount,
        category,
        date: new Date().toISOString()
    };
    
    transactions.unshift(newTransaction);
    
    // Clear form
    transactionForm.reset();
    
    updateUI();
}

// Update transaction list
function updateTransactionList() {
    const currentMonthTrans = getCurrentMonthTransactions();
    const sortOrderValue = sortOrder.value;
    
    // Sort transactions
    let sortedTrans = [...currentMonthTrans];
    
    switch (sortOrderValue) {
        case 'newest':
            sortedTrans.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            sortedTrans.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'amount-desc':
            sortedTrans.sort((a, b) => b.amount - a.amount);
            break;
        case 'amount-asc':
            sortedTrans.sort((a, b) => a.amount - b.amount);
            break;
    }
    
    // Render transactions
    if (sortedTrans.length === 0) {
        transactionListEl.innerHTML = '<p class="no-transactions">Belum ada transaksi untuk bulan ini</p>';
        return;
    }
    
    transactionListEl.innerHTML = sortedTrans.map(trans => `
        <div class="transaction-item">
            <div class="item-info">
                <div class="item-name">${trans.itemName}</div>
                <div class="item-category">${trans.category}</div>
            </div>
            <div class="item-amount ${trans.amount >= 0 ? 'positive' : 'negative'}">
                ${trans.amount >= 0 ? '+' : '-'}${formatCurrency(Math.abs(trans.amount))}
            </div>
            <button class="btn-delete" onclick="deleteTransaction(${trans.id})">Hapus</button>
        </div>
    `).join('');
}

// Delete transaction
window.deleteTransaction = function(id) {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        transactions = transactions.filter(trans => trans.id !== id);
        updateUI();
    }
};

// Set spending limit
function setSpendingLimit() {
    const limit = parseFloat(limitAmountInput.value);
    
    if (isNaN(limit) || limit <= 0) {
        alert('Masukkan batas yang valid!');
        return;
    }
    
    spendingLimit = limit;
    limitAmountInput.value = '';
    
    updateSpendingLimitDisplay();
    saveToLocalStorage();
}

// Update spending limit display
function updateSpendingLimitDisplay() {
    if (spendingLimit === null) {
        limitAmountDisplay.textContent = 'Tidak diatur';
        limitDisplay.style.display = 'none';
        return;
    }
    
    limitDisplay.style.display = 'block';
    limitAmountDisplay.textContent = formatCurrency(spendingLimit);
    
    const currentExpenses = monthlyExpense;
    const percentage = Math.min((currentExpenses / spendingLimit) * 100, 100);
    
    progressFill.style.width = `${percentage}%`;
    
    if (percentage >= 90) {
        progressFill.style.backgroundColor = '#e94560';
        limitStatus.textContent = '⚠️ Batas hampir tercapai!';
        limitStatus.className = 'limit-status danger';
    } else if (percentage >= 70) {
        progressFill.style.backgroundColor = '#ff9800';
        limitStatus.textContent = '⚠️ Batas terlampaui!';
        limitStatus.className = 'limit-status warning';
    } else {
        progressFill.style.backgroundColor = '#4caf50';
        limitStatus.textContent = '✅ Batas pengeluaran terjaga';
        limitStatus.className = 'limit-status';
    }
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

// Initial update
updateUI();