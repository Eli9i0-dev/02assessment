document.addEventListener('DOMContentLoaded', function() {
    //Register
    const form = document.getElementById("registerForm");
    //Only run if we're on the registration page
    if (form) {

    const msg  = document.getElementById("msg");

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        let name = document.getElementById("name").value.trim();
        let email = document.getElementById("email").value.trim();
        let password = document.getElementById("password").value;

    // Name and password lenght validation
        if (name.length < 3) {
            msg.textContent = "Name must be at least 3 characters.";
            return;
        }

        if (password.length < 6) {
            msg.textContent = "Password must be at least 6 characters.";
            return;
         }

        // Load existing users or create array if none
        let users = JSON.parse(localStorage.getItem("users")) || [];

        // Check if user already exists
        let exists = users.find(u => u.email === email);

        if (exists) {
            msg.textContent = "This email is already registered.";
            return;
        }

        // Save new user
        users.push({ name, email, password });
        localStorage.setItem("users", JSON.stringify(users));

        msg.style.color = "green";
        msg.textContent = "Registration successful! Redirecting...";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
    });
}
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        const loginMsg  = document.getElementById("msg");

        loginForm.addEventListener("submit", function(e) {
        e.preventDefault();

        let email = document.getElementById("email").value.trim();
        let password = document.getElementById("password").value;

        let users = JSON.parse(localStorage.getItem("users")) || [];

        // 1. Check if email exists at all
        let user = users.find(u => u.email === email);

        if (!user) {
            loginMsg.style.color = "red";
            loginMsg.textContent = "Email not registered.";
            return;
        }

        // 2. Email exists → check password
        if (user.password !== password) {
            loginMsg.style.color = "red";
            loginMsg.textContent = "Incorrect password.";
            return;
        }

        // 3. Successful login
        localStorage.setItem("loggedInUser", JSON.stringify({
            name: user.name,
            email: user.email
        }));

        loginMsg.style.color = "green";
        loginMsg.textContent = "Login successful! Redirecting...";

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);
        });
    }
     // User Authentication UI - runs on all pages that have #buttons element
    let user = JSON.parse(localStorage.getItem("loggedInUser"));
    let container = document.getElementById("buttons");

    if (user && container) {
        // User is logged in -> Show Logout button
        container.innerHTML = `
            <p class="hiuser">Hello, ${user.name}!</p>
            <button id="logoutBtn">Logout</button>
        `;

        document.getElementById("logoutBtn").addEventListener("click", function() {
            localStorage.removeItem("loggedInUser");
            window.location.reload(); // refresh to show Login again
        });

    } else if (container) {
        // No user logged in -> Show Login & Register
        container.innerHTML = `
            <button onclick="window.location.href='login.html'">Login</button>
            <button onclick="window.location.href='register.html'">Register</button>
        `;
    }
});
//Cart Functionality
(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    const CART_KEY = loggedInUser ? `cart_${loggedInUser.email}` : null;

    let cart = [];
    if (loggedInUser && CART_KEY) {
        const saved = localStorage.getItem(CART_KEY);
        cart = saved ? JSON.parse(saved) : [];
    }
    else{
        cart = [];
    }

    // DOM
    const cartBtn = document.getElementById('cartBtn');
    const cartCountEl = document.getElementById('cartCount');
    const cartModal = document.getElementById('cartModal');
    const cartBackdrop = document.getElementById('cartBackdrop');
    const closeCart = document.getElementById('closeCart');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartTotalEl = document.getElementById('cartTotal');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');

    // product buttons
    const addButtons = Array.from(document.querySelectorAll('.product-card .add-cart-btn'));

    // Helpers
    const formatPrice = n => `$${Number(n).toFixed(2)}`;

    const saveCart = () => {
        if (CART_KEY) localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }

    const findCartItem = id => cart.find(item => item.id == id);

    const updateCartCount = () => {
        const count =cart.reduce((s, item) => s + (Number(item.quantity) || 0), 0);
        cartCountEl.textContent = count;

        //HIDE CART
        if (count === 0) {
            cartBtn.style.display = "none";
        }
        else {
            cartBtn.style.display = "flex";
        }
    }

    const calcCartTotal = () => cart.reduce((s, item) => s + (item.price * item.quantity), 0);

    const escapeHtml = str => String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Render
        const renderCart = () => {
        cartItemsContainer.innerHTML = '';
        if (!cart.length) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            cartTotalEl.textContent = formatPrice(0);
            updateCartCount();
            return;
        }

        cart.forEach(item => {
            const node = document.createElement('div');
            node.className = 'cart-item';
            node.innerHTML = `
                <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
                <div class="cart-item__info">
                    <p class="cart-item__title">${escapeHtml(item.name)}</p>
                    <p class="cart-item__price">${formatPrice(item.price)}</p>
                </div>
                <div class="cart-item__controls">
                    <button class="qty-btn" data-action="decrease" data-id="${item.id}">−</button>
                    <span class="qty-value" data-id="${item.id}">${item.quantity}</span>
                    <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
                    <button class="qty-btn" data-action="remove" data-id="${item.id}" title="Remove">🗑</button>
                </div>
            `;
            cartItemsContainer.appendChild(node);
        });

        cartTotalEl.textContent = formatPrice(calcCartTotal());
        updateCartCount();
    }

    // Actions
    const addToCartFromCard = button => {
        if (!loggedInUser) {
            alert("You must be logged in to add items to the cart.");
            return;
        }

        const card = button.closest('.product-card');
        if (!card) return;

        const name = card.querySelector('.product-name')?.textContent.trim() || 'Product';
        const price = parseFloat(card.querySelector('.product-price')?.textContent.replace(/[^0-9.]/g, '')) || 0;
        const image = card.querySelector('img')?.src || '';
        const id = (card.dataset.productId || `${name}-${price}`).replace(/\s+/g, '-');

        const existing = findCartItem(id);
        if (existing) existing.quantity += 1;
        else cart.push({ id, name, price, image, quantity: 1 });

        saveCart();
        renderCart();
    }

    const changeQuantity = (id, delta) => {
        const item = findCartItem(id);
        if (!item) return;
        item.quantity += delta;
        if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
        saveCart();
        renderCart();
    }

    const removeItem = id => {
        cart = cart.filter(i => i.id !== id);
        saveCart();
        renderCart();
    }

    const clearCart = () => {
        if (!confirm('Clear cart?')) return;
        cart = [];
        saveCart();
        renderCart();
    }

    const openCart = () => {
        cartModal.classList.add('is-open');
        cartModal.setAttribute('aria-hidden', 'false');
        renderCart();
    }

    const closeCartModal = () => {
        cartModal.classList.remove('is-open');
        cartModal.setAttribute('aria-hidden', 'true');
    }

    const logout = () => {
        localStorage.removeItem("loggedInUser");
        window.location.href = "login.html";
    }

    // wire add buttons
    if (loggedInUser) {
        addButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                addToCartFromCard(btn);
                
                // animation only if cartBtn exists
                cartBtn?.animate(
                    [{ transform:'scale(1)' }, { transform:'scale(1.08)' }, { transform:'scale(1)' }],
                    { duration: 200 }
                );
            });
        });
    }


    // --- EVENT LISTENERS ---
    cartBtn?.addEventListener('click', openCart);
    cartBackdrop?.addEventListener('click', closeCartModal);
    closeCart?.addEventListener('click', closeCartModal);
    clearCartBtn?.addEventListener('click', clearCart);
    checkoutBtn?.addEventListener('click', () => {
        window.location.href = 'checkout.html';
    });

    cartItemsContainer.addEventListener('click', e => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (action === 'increase') changeQuantity(id, 1);
        else if (action === 'decrease') changeQuantity(id, -1);
        else if (action === 'remove') removeItem(id);
    });

    // --- INITIALIZE ---
    renderCart();

    // Disable add buttons if not logged in
    if (!loggedInUser) addButtons.forEach(btn => btn.disabled = true);

    // Expose for debugging
    window._shopCart = { get: () => cart, save: saveCart, render: renderCart, logout };

}
)();

