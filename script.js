document.addEventListener('DOMContentLoaded', function() {
    // ===== DATA PRODUK AWAL (DEFAULT) =====
    const DEFAULT_PRODUCTS = [
        {
            id: 'p1',
            name: 'HOLO ALL CHAR FFM',
            oldPrice: 22000,
            newPrice: 22000,
            discount: 0,
            timerEnd: null,
            buttonText: '[ ORDER ]'
        },
        {
            id: 'p2',
            name: 'HOLO SENJATA FFM',
            oldPrice: 18000,
            newPrice: 18000,
            discount: 0,
            timerEnd: null,
            buttonText: '[ ORDER ]'
        },
        {
            id: 'p3',
            name: 'HOLO SENJATA FFB',
            oldPrice: 15000,
            newPrice: 15000,
            discount: 0,
            timerEnd: null,
            buttonText: '[ ORDER ]'
        }
    ];

    // ===== VALIDASI DATA DARI LOCALSTORAGE =====
    function isValidProduct(product) {
        return product && 
               typeof product.id === 'string' &&
               typeof product.name === 'string' &&
               typeof product.oldPrice === 'number' &&
               typeof product.newPrice === 'number' &&
               typeof product.discount === 'number' &&
               product.oldPrice > 0;
    }

    // ===== LOAD DATA DARI LOCALSTORAGE =====
    function loadProducts() {
        try {
            const saved = localStorage.getItem('zerModzProducts');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validasi array
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Filter produk yang valid
                    const validProducts = parsed.filter(isValidProduct);
                    
                    if (validProducts.length > 0) {
                        // Konversi timerEnd dari string ke Date object
                        validProducts.forEach(p => {
                            if (p.timerEnd) {
                                p.timerEnd = new Date(p.timerEnd);
                                // Cek apakah timer sudah expired
                                if (p.timerEnd <= new Date()) {
                                    p.timerEnd = null;
                                    p.newPrice = p.oldPrice;
                                    p.discount = 0;
                                }
                            }
                        });
                        console.log('✅ Load produk dari LocalStorage:', validProducts.length);
                        return validProducts;
                    }
                }
            }
        } catch (e) {
            console.error('❌ Error load LocalStorage:', e);
            // Hapus data corrupt
            localStorage.removeItem('zerModzProducts');
        }
        
        console.log('📦 Pakai produk default');
        return DEFAULT_PRODUCTS.map(p => ({...p})); // Clone array
    }

    // ===== SAVE DATA KE LOCALSTORAGE =====
    function saveProducts() {
        try {
            // Hapus circular reference, simpan hanya data yang diperlukan
            const productsToSave = products.map(p => ({
                ...p,
                timerEnd: p.timerEnd ? p.timerEnd.toISOString() : null
            }));
            localStorage.setItem('zerModzProducts', JSON.stringify(productsToSave));
            console.log('💾 Produk tersimpan');
        } catch (e) {
            console.error('❌ Gagal save ke LocalStorage:', e);
        }
    }

    // ===== RESET KE DEFAULT =====
    window.resetToDefault = function() {
        if (confirm('Yakin reset ke data awal? Semua perubahan akan hilang!')) {
            products = DEFAULT_PRODUCTS.map(p => ({...p}));
            saveProducts();
            renderProducts();
            
            // Reload admin panel jika sedang terbuka
            if (!document.getElementById('adminPanelContainer').classList.contains('hidden')) {
                loadAdminPanel();
            }
            
            console.log('🔄 Reset ke produk default');
        }
    };

    // ===== DATA PRODUK (GLOBAL) =====
    let products = loadProducts();

    // ===== VARIABEL GLOBAL =====
    let offset = 0;
    try {
        offset = parseInt(localStorage.getItem('zerModzOffset')) || 0;
    } catch (e) {
        offset = 0;
    }
    
    let timerInterval = null;

    // ===== REAL TIME CLOCK =====
    function updateClock() {
        try {
            const now = new Date();
            const adjusted = new Date(now.getTime() + offset * 60000);
            const hours = adjusted.getHours().toString().padStart(2, '0');
            const mins = adjusted.getMinutes().toString().padStart(2, '0');
            const secs = adjusted.getSeconds().toString().padStart(2, '0');
            document.getElementById('clock').innerText = `${hours}:${mins}:${secs}`;
            const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
            document.getElementById('date').innerText = adjusted.toLocaleDateString('id-ID', options);
        } catch (e) {
            console.error('Clock error:', e);
        }
    }
    setInterval(updateClock, 1000);
    updateClock();

    // ===== FORMAT TIMER =====
    function formatTimeLeft(ms) {
        if (ms <= 0) return '00:00:00';
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // ===== UPDATE TIMER =====
    function startProductTimers() {
        if (timerInterval) clearInterval(timerInterval);
        
        timerInterval = setInterval(() => {
            try {
                let needRender = false;
                let needSave = false;
                const now = new Date();
                
                products.forEach(product => {
                    if (product.timerEnd) {
                        const timeLeft = product.timerEnd - now;
                        
                        if (timeLeft <= 0) {
                            console.log(`⏰ Timer habis untuk ${product.name}`);
                            product.newPrice = product.oldPrice;
                            product.discount = 0;
                            product.timerEnd = null;
                            needRender = true;
                            needSave = true;
                        }
                    }
                });
                
                if (needSave) {
                    saveProducts();
                }
                
                if (needRender) {
                    renderProducts();
                } else {
                    updateTimerDisplays();
                }
            } catch (e) {
                console.error('Timer error:', e);
            }
        }, 1000);
    }

    function updateTimerDisplays() {
        try {
            const now = new Date();
            products.forEach(product => {
                if (product.timerEnd) {
                    const timeLeft = product.timerEnd - now;
                    const timerElement = document.querySelector(`#product-${product.id} .timer-badge`);
                    if (timerElement) {
                        if (timeLeft <= 0) {
                            timerElement.remove();
                        } else {
                            timerElement.innerText = `⏱️ ${formatTimeLeft(timeLeft)}`;
                        }
                    }
                }
            });
        } catch (e) {
            console.error('Update timer display error:', e);
        }
    }

    // ===== FUNGSI WA ORDER =====
    function handleOrder(productName, productPrice) {
        try {
            const phoneNumber = '6289653938936';
            const message = encodeURIComponent(`Halo kak saya mau order ${productName} (Rp ${productPrice.toLocaleString()})`);
            window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        } catch (e) {
            console.error('WA order error:', e);
            alert('Gagal membuka WhatsApp');
        }
    }

    // ===== RENDER PRODUK =====
    function renderProducts() {
        try {
            const grid = document.getElementById('productGrid');
            if (!grid) {
                console.error('Grid tidak ditemukan!');
                return;
            }
            
            grid.innerHTML = '';
            
            if (!products || products.length === 0) {
                // Fallback jika produk kosong
                products = DEFAULT_PRODUCTS.map(p => ({...p}));
                saveProducts();
            }
            
            products.forEach(product => {
                // Validasi produk sebelum render
                if (!product || !product.id) return;
                
                // Cek timer expired
                if (product.timerEnd && new Date() > product.timerEnd) {
                    product.newPrice = product.oldPrice;
                    product.discount = 0;
                    product.timerEnd = null;
                    saveProducts();
                }

                const card = document.createElement('div');
                card.className = 'product';
                card.id = `product-${product.id}`;
                
                const discPercent = product.oldPrice > 0 ? 
                    Math.round(((product.oldPrice - product.newPrice) / product.oldPrice) * 100) : 0;
                
                let timerHtml = '';
                if (product.timerEnd) {
                    const timeLeft = product.timerEnd - new Date();
                    if (timeLeft > 0) {
                        timerHtml = `<div class="timer-badge">⏱️ ${formatTimeLeft(timeLeft)}</div>`;
                    }
                }

                const buttonText = product.buttonText || '[ ORDER ]';

                card.innerHTML = `
                    <div class="product-name">${product.name || 'Produk'}</div>
                    <div class="product-price">
                        <span class="old-price">Rp ${(product.oldPrice || 0).toLocaleString()}</span>
                        <span class="new-price">Rp ${(product.newPrice || 0).toLocaleString()}</span>
                    </div>
                    ${discPercent > 0 ? `<div class="discount-badge">DISKON ${discPercent}%</div>` : ''}
                    ${timerHtml}
                    <button class="order-btn" data-product-id="${product.id}">${buttonText}</button>
                `;
                
                grid.appendChild(card);
            });

            // Event listener ORDER
            document.querySelectorAll('.order-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    const productId = this.dataset.productId;
                    const product = products.find(p => p.id === productId);
                    if (product) {
                        handleOrder(product.name, product.newPrice);
                    }
                });
            });
            
            console.log('🎨 Render produk selesai, total:', products.length);
        } catch (e) {
            console.error('Render error:', e);
        }
    }

    // ===== MODAL LOGIN =====
    const modal = document.getElementById('loginModal');
    const profileBtn = document.getElementById('adminProfileBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const loginBtn = document.getElementById('loginBtn');
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const loginMessage = document.getElementById('loginMessage');
    const adminPanelContainer = document.getElementById('adminPanelContainer');

    if (profileBtn) {
        profileBtn.addEventListener('click', function() {
            modal.classList.remove('hidden');
            username.value = '';
            password.value = '';
            loginMessage.innerText = '';
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
        });
    }

    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            if (username.value === 'ZeroXitAndro' && password.value === 'ROBB15') {
                modal.classList.add('hidden');
                adminPanelContainer.classList.remove('hidden');
                loginMessage.innerText = '';
                loadAdminPanel();
            } else {
                loginMessage.innerText = '✗ Username/password salah';
            }
        });
    }

    // ===== LOAD ADMIN PANEL =====
    function loadAdminPanel() {
        try {
            const panelBody = document.getElementById('adminPanelBody');
            if (!panelBody) return;
            
            panelBody.innerHTML = `
                <!-- TAMBAH PRODUK -->
                <div class="admin-section">
                    <div class="admin-section-title">➕ TAMBAH PRODUK</div>
                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                        <input type="text" id="newProductName" placeholder="Nama produk" style="flex:2; background:black; border:2px solid white; color:white; padding:0.5rem 1rem; border-radius:40px;">
                        <input type="number" id="newProductPrice" placeholder="Harga" style="flex:1; background:black; border:2px solid white; color:white; padding:0.5rem 1rem; border-radius:40px;">
                        <input type="text" id="newProductButton" placeholder="Teks button" value="[ ORDER ]" style="flex:1; background:black; border:2px solid white; color:white; padding:0.5rem 1rem; border-radius:40px;">
                        <button id="addProductBtn" class="admin-btn" style="padding:0.5rem 1.2rem;">TAMBAH</button>
                    </div>
                </div>
                
                <!-- OFFSET WAKTU -->
                <div class="admin-section">
                    <div class="admin-section-title">⏱️ OFFSET WAKTU</div>
                    <div class="admin-row">
                        <span class="admin-label">MENIT</span>
                        <div class="admin-control">
                            <input type="number" id="offsetInput" value="${offset}" min="-720" max="720">
                            <button id="applyOffsetBtn" class="admin-btn">TERAP</button>
                        </div>
                    </div>
                </div>
                
                <!-- RESET KE DEFAULT -->
                <div class="admin-section">
                    <div class="admin-section-title">⚠️ RESET DATA</div>
                    <div style="display:flex; gap:0.5rem;">
                        <button id="resetToDefaultBtn" class="admin-btn warn" style="flex:1;">RESET KE AWAL</button>
                    </div>
                </div>
                
                <!-- DAFTAR PRODUK -->
                <div class="admin-section">
                    <div class="admin-section-title">📦 DAFTAR PRODUK (${products.length})</div>
                    <div id="productListContainer" style="max-height:300px; overflow-y:auto;"></div>
                </div>
                
                <!-- DISKON + TIMER -->
                <div class="admin-section">
                    <div class="admin-section-title">🏷️ DISKON + TIMER</div>
                    <div id="discountControlContainer"></div>
                </div>
                
                <!-- EDIT HARGA -->
                <div class="admin-section">
                    <div class="admin-section-title">💰 EDIT HARGA</div>
                    <div id="priceEditContainer"></div>
                </div>

                <!-- EDIT NAMA PRODUK -->
                <div class="admin-section">
                    <div class="admin-section-title">✏️ EDIT NAMA PRODUK</div>
                    <div id="productNameEditContainer"></div>
                </div>

                <!-- EDIT TEKS BUTTON -->
                <div class="admin-section">
                    <div class="admin-section-title">🔘 EDIT TEKS BUTTON</div>
                    <div id="buttonTextContainer"></div>
                </div>
            `;

            renderProductListForAdmin();
            renderDiscountControls();
            renderPriceControls();
            renderProductNameControls();
            renderButtonTextControls();

            // EVENT LISTENERS
            const applyOffsetBtn = document.getElementById('applyOffsetBtn');
            if (applyOffsetBtn) {
                applyOffsetBtn.addEventListener('click', function() {
                    const val = parseInt(document.getElementById('offsetInput').value, 10);
                    if (!isNaN(val)) {
                        offset = val;
                        localStorage.setItem('zerModzOffset', offset);
                        updateClock();
                    }
                });
            }

            const addProductBtn = document.getElementById('addProductBtn');
            if (addProductBtn) {
                addProductBtn.addEventListener('click', function() {
                    const name = document.getElementById('newProductName').value.trim();
                    const price = document.getElementById('newProductPrice').value;
                    const buttonText = document.getElementById('newProductButton').value.trim() || '[ ORDER ]';
                    
                    if (name && price && !isNaN(price) && parseInt(price) > 0) {
                        addProduct(name, price, buttonText);
                        document.getElementById('newProductName').value = '';
                        document.getElementById('newProductPrice').value = '';
                        document.getElementById('newProductButton').value = '[ ORDER ]';
                        loadAdminPanel();
                    }
                });
            }

            const resetBtn = document.getElementById('resetToDefaultBtn');
            if (resetBtn) {
                resetBtn.addEventListener('click', window.resetToDefault);
            }

            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function() {
                    adminPanelContainer.classList.add('hidden');
                });
            }
            
            console.log('⚙️ Admin panel loaded');
        } catch (e) {
            console.error('Load admin panel error:', e);
        }
    }

    // ===== RENDER LIST PRODUK ADMIN =====
    function renderProductListForAdmin() {
        try {
            const container = document.getElementById('productListContainer');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (!products || products.length === 0) {
                container.innerHTML = '<div style="color:white; padding:1rem; text-align:center;">Tidak ada produk</div>';
                return;
            }
            
            products.forEach(product => {
                if (!product || !product.id) return;
                
                const item = document.createElement('div');
                item.className = 'product-list-item';
                item.innerHTML = `
                    <span style="font-weight:bold;">${product.name || 'Tanpa nama'}</span>
                    <span>Rp ${(product.oldPrice || 0).toLocaleString()}</span>
                    <span style="color:#ff6b35;">${product.buttonText || '[ ORDER ]'}</span>
                    <div>
                        <button class="admin-btn small" onclick="window.deleteProduct('${product.id}')">HAPUS</button>
                    </div>
                `;
                container.appendChild(item);
            });
        } catch (e) {
            console.error('Render product list error:', e);
        }
    }

    // ===== RENDER KONTROL DISKON =====
    function renderDiscountControls() {
        try {
            const container = document.getElementById('discountControlContainer');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (!products || products.length === 0) {
                container.innerHTML = '<div style="color:white; padding:1rem; text-align:center;">Tidak ada produk</div>';
                return;
            }
            
            products.forEach(product => {
                if (!product || !product.id) return;
                
                const row = document.createElement('div');
                row.className = 'admin-row';
                row.innerHTML = `
                    <span class="admin-label">${product.name ? product.name.substring(0, 15) : 'Produk'}...</span>
                    <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">
                        <input type="number" id="disc_${product.id}" placeholder="%" min="0" max="100" style="width:60px;" value="${product.discount || ''}">
                        <input type="number" id="timer_${product.id}" placeholder="menit" min="0" style="width:70px;" value="">
                        <input type="number" id="detik_${product.id}" placeholder="detik" min="0" max="59" style="width:70px;" value="">
                        <button class="admin-btn small" onclick="window.applyDiscTimer('${product.id}')">TERAP</button>
                    </div>
                `;
                container.appendChild(row);
            });
        } catch (e) {
            console.error('Render discount controls error:', e);
        }
    }

    // ===== RENDER EDIT HARGA =====
    function renderPriceControls() {
        try {
            const container = document.getElementById('priceEditContainer');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (!products || products.length === 0) {
                container.innerHTML = '<div style="color:white; padding:1rem; text-align:center;">Tidak ada produk</div>';
                return;
            }
            
            products.forEach(product => {
                if (!product || !product.id) return;
                
                const row = document.createElement('div');
                row.className = 'admin-row';
                row.innerHTML = `
                    <span class="admin-label">${product.name ? product.name.substring(0, 15) : 'Produk'}...</span>
                    <div style="display:flex; gap:0.3rem;">
                        <input type="number" id="price_${product.id}" placeholder="Harga" value="${product.oldPrice || 0}" style="width:80px;">
                        <button class="admin-btn small" onclick="window.updatePrice('${product.id}')">UBAH</button>
                    </div>
                `;
                container.appendChild(row);
            });
        } catch (e) {
            console.error('Render price controls error:', e);
        }
    }

    // ===== RENDER EDIT NAMA PRODUK =====
    function renderProductNameControls() {
        try {
            const container = document.getElementById('productNameEditContainer');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (!products || products.length === 0) {
                container.innerHTML = '<div style="color:white; padding:1rem; text-align:center;">Tidak ada produk</div>';
                return;
            }
            
            products.forEach(product => {
                if (!product || !product.id) return;
                
                const row = document.createElement('div');
                row.className = 'admin-row';
                row.innerHTML = `
                    <span class="admin-label">ID: ${product.id}</span>
                    <div style="display:flex; gap:0.3rem; flex:1; justify-content:flex-end;">
                        <input type="text" id="name_${product.id}" placeholder="Nama produk" value="${product.name || ''}" style="width:180px; background:black; border:2px solid white; color:white; padding:0.3rem 0.6rem; border-radius:30px;">
                        <button class="admin-btn small" onclick="window.updateProductName('${product.id}')">UBAH</button>
                    </div>
                `;
                container.appendChild(row);
            });
        } catch (e) {
            console.error('Render name controls error:', e);
        }
    }

    // ===== RENDER EDIT TEKS BUTTON =====
    function renderButtonTextControls() {
        try {
            const container = document.getElementById('buttonTextContainer');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (!products || products.length === 0) {
                container.innerHTML = '<div style="color:white; padding:1rem; text-align:center;">Tidak ada produk</div>';
                return;
            }
            
            products.forEach(product => {
                if (!product || !product.id) return;
                
                const row = document.createElement('div');
                row.className = 'admin-row';
                row.innerHTML = `
                    <span class="admin-label">${product.name ? product.name.substring(0, 15) : 'Produk'}...</span>
                    <div style="display:flex; gap:0.3rem;">
                        <input type="text" id="btn_${product.id}" placeholder="Teks button" value="${product.buttonText || '[ ORDER ]'}" style="width:120px; background:black; border:2px solid white; color:white; padding:0.3rem 0.6rem; border-radius:30px;">
                        <button class="admin-btn small" onclick="window.updateButtonText('${product.id}')">UBAH</button>
                    </div>
                `;
                container.appendChild(row);
            });
        } catch (e) {
            console.error('Render button text controls error:', e);
        }
    }

    // ===== FUNGSI GLOBAL =====
    window.deleteProduct = function(productId) {
        if (confirm('Yakin hapus produk ini?')) {
            products = products.filter(p => p.id !== productId);
            saveProducts();
            renderProducts();
            
            if (!document.getElementById('adminPanelContainer').classList.contains('hidden')) {
                loadAdminPanel();
            }
        }
    };

    window.applyDiscTimer = function(productId) {
        try {
            const discInput = document.getElementById(`disc_${productId}`);
            const timerInput = document.getElementById(`timer_${productId}`);
            const detikInput = document.getElementById(`detik_${productId}`);
            
            const disc = discInput ? discInput.value : 0;
            const menit = timerInput ? parseInt(timerInput.value) || 0 : 0;
            const detik = detikInput ? parseInt(detikInput.value) || 0 : 0;
            
            const product = products.find(p => p.id === productId);
            if (product) {
                const discPercent = parseFloat(disc);
                if (!isNaN(discPercent) && discPercent >= 0) {
                    product.discount = discPercent;
                    product.newPrice = discPercent >= 100 ? 0 : 
                        Math.round(product.oldPrice - (product.oldPrice * discPercent / 100));
                    
                    if (menit > 0 || detik > 0) {
                        const totalMs = (menit * 60 + detik) * 1000;
                        product.timerEnd = new Date(new Date().getTime() + totalMs);
                        console.log(`⏰ Timer set: ${menit}m ${detik}s untuk ${product.name}`);
                    } else {
                        product.timerEnd = null;
                    }
                    
                    saveProducts();
                    renderProducts();
                    
                    if (!document.getElementById('adminPanelContainer').classList.contains('hidden')) {
                        loadAdminPanel();
                    }
                }
            }
        } catch (e) {
            console.error('Apply discount error:', e);
            alert('Gagal menerapkan diskon');
        }
    };

    window.updatePrice = function(productId) {
        try {
            const priceInput = document.getElementById(`price_${productId}`);
            if (priceInput) {
                const newPrice = parseInt(priceInput.value);
                if (!isNaN(newPrice) && newPrice > 0) {
                    const product = products.find(p => p.id === productId);
                    if (product) {
                        product.oldPrice = newPrice;
                        if (!product.timerEnd) {
                            product.newPrice = newPrice;
                        }
                        saveProducts();
                        renderProducts();
                        
                        if (!document.getElementById('adminPanelContainer').classList.contains('hidden')) {
                            loadAdminPanel();
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Update price error:', e);
            alert('Gagal mengupdate harga');
        }
    };

    window.updateProductName = function(productId) {
        try {
            const nameInput = document.getElementById(`name_${productId}`);
            if (nameInput) {
                const newName = nameInput.value.trim();
                if (newName) {
                    const product = products.find(p => p.id === productId);
                    if (product) {
                        product.name = newName;
                        saveProducts();
                        renderProducts();
                        
                        if (!document.getElementById('adminPanelContainer').classList.contains('hidden')) {
                            loadAdminPanel();
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Update name error:', e);
            alert('Gagal mengupdate nama');
        }
    };

    window.updateButtonText = function(productId) {
        try {
            const btnInput = document.getElementById(`btn_${productId}`);
            if (btnInput) {
                const newText = btnInput.value.trim() || '[ ORDER ]';
                const product = products.find(p => p.id === productId);
                if (product) {
                    product.buttonText = newText;
                    saveProducts();
                    renderProducts();
                    
                    if (!document.getElementById('adminPanelContainer').classList.contains('hidden')) {
                        loadAdminPanel();
                    }
                }
            }
        } catch (e) {
            console.error('Update button text error:', e);
            alert('Gagal mengupdate teks button');
        }
    };

    function addProduct(name, price, buttonText = '[ ORDER ]') {
        try {
            const newId = 'p' + Date.now() + Math.random().toString(36).substr(2, 4);
            products.push({
                id: newId,
                name: name,
                oldPrice: parseInt(price),
                newPrice: parseInt(price),
                discount: 0,
                timerEnd: null,
                buttonText: buttonText
            });
            saveProducts();
            renderProducts();
            console.log('➕ Produk ditambahkan:', name);
        } catch (e) {
            console.error('Add product error:', e);
            alert('Gagal menambah produk');
        }
    }

    // ===== MULAI TIMER =====
    startProductTimers();

    // ===== RENDER AWAL =====
    renderProducts();
    
    console.log('🚀 Aplikasi siap!');
});