// FRUITA GREEN static site — mobile nav, category filters, and a simple
// localStorage-backed cart (this is a static catalog, so checkout hands off
// to phone/email instead of a real payment flow).

function fgInit() {
	var CART_KEY = 'fruitagreen_cart';

	function getCart() {
		try {
			return JSON.parse(localStorage.getItem(CART_KEY)) || {};
		} catch (e) {
			return {};
		}
	}

	function saveCart(cart) {
		localStorage.setItem(CART_KEY, JSON.stringify(cart));
	}

	function getProduct(id) {
		return window.FG_PRODUCTS.find(function (p) { return p.id === id; });
	}

	function money(n) {
		return '$' + n.toFixed(2);
	}

	function cartCount(cart) {
		return Object.values(cart).reduce(function (sum, qty) { return sum + qty; }, 0);
	}

	function updateCartBadge() {
		var cart = getCart();
		var count = cartCount(cart);
		document.querySelectorAll('.cart-count').forEach(function (el) {
			el.textContent = count;
		});
	}

	function renderCartDrawer() {
		var cart = getCart();
		var itemsEl = document.querySelector('.cart-drawer__items');
		var subtotalEl = document.querySelector('.cart-drawer__subtotal-value');
		var footerBtn = document.querySelector('.cart-drawer__checkout');
		if (!itemsEl) return;

		var ids = Object.keys(cart).filter(function (id) { return cart[id] > 0; });

		if (ids.length === 0) {
			itemsEl.innerHTML = '<div class="cart-empty">Your cart is empty.<br>Add something fresh from the shop!</div>';
			if (subtotalEl) subtotalEl.textContent = money(0);
			if (footerBtn) footerBtn.disabled = true;
			return;
		}

		if (footerBtn) footerBtn.disabled = false;

		var subtotal = 0;
		itemsEl.innerHTML = ids.map(function (id) {
			var product = getProduct(id);
			if (!product) return '';
			var qty = cart[id];
			var lineTotal = product.price * qty;
			subtotal += lineTotal;
			return (
				'<div class="cart-item" data-id="' + id + '">' +
					'<div class="cart-item__icon">' + product.icon + '</div>' +
					'<div class="cart-item__body">' +
						'<div class="cart-item__title">' + product.title + '</div>' +
						'<div class="cart-item__price">' + money(product.price) + ' each</div>' +
						'<div class="cart-item__qty">' +
							'<button type="button" class="qty-minus" aria-label="Decrease quantity">−</button>' +
							'<span>' + qty + '</span>' +
							'<button type="button" class="qty-plus" aria-label="Increase quantity">+</button>' +
							'<button type="button" class="cart-item__remove">Remove</button>' +
						'</div>' +
					'</div>' +
				'</div>'
			);
		}).join('');

		if (subtotalEl) subtotalEl.textContent = money(subtotal);
	}

	function addToCart(id, btn) {
		var cart = getCart();
		cart[id] = (cart[id] || 0) + 1;
		saveCart(cart);
		updateCartBadge();
		renderCartDrawer();
		showToast('Added to cart');
		if (btn) {
			var original = btn.textContent;
			btn.textContent = 'Added ✓';
			setTimeout(function () { btn.textContent = original; }, 1200);
		}
	}

	function changeQty(id, delta) {
		var cart = getCart();
		cart[id] = (cart[id] || 0) + delta;
		if (cart[id] <= 0) delete cart[id];
		saveCart(cart);
		updateCartBadge();
		renderCartDrawer();
	}

	function removeFromCart(id) {
		var cart = getCart();
		delete cart[id];
		saveCart(cart);
		updateCartBadge();
		renderCartDrawer();
	}

	var toastTimer;
	function showToast(msg) {
		var toast = document.querySelector('.toast');
		if (!toast) return;
		toast.textContent = msg;
		toast.classList.add('show');
		clearTimeout(toastTimer);
		toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
	}

	// Add-to-cart buttons
	document.querySelectorAll('[data-add-to-cart]').forEach(function (btn) {
		btn.addEventListener('click', function () {
			addToCart(btn.getAttribute('data-add-to-cart'), btn);
		});
	});

	// Cart drawer open/close
	var overlay = document.querySelector('.cart-overlay');
	var drawer = document.querySelector('.cart-drawer');
	function openCart() {
		if (overlay) overlay.classList.add('open');
		if (drawer) drawer.classList.add('open');
		renderCartDrawer();
	}
	function closeCart() {
		if (overlay) overlay.classList.remove('open');
		if (drawer) drawer.classList.remove('open');
	}
	document.querySelectorAll('.cart-toggle').forEach(function (btn) {
		btn.addEventListener('click', openCart);
	});
	if (overlay) overlay.addEventListener('click', closeCart);
	var closeBtn = document.querySelector('.cart-drawer__close');
	if (closeBtn) closeBtn.addEventListener('click', closeCart);

	// Cart item qty/remove (event delegation)
	var itemsContainer = document.querySelector('.cart-drawer__items');
	if (itemsContainer) {
		itemsContainer.addEventListener('click', function (e) {
			var itemEl = e.target.closest('.cart-item');
			if (!itemEl) return;
			var id = itemEl.getAttribute('data-id');
			if (e.target.classList.contains('qty-plus')) changeQty(id, 1);
			if (e.target.classList.contains('qty-minus')) changeQty(id, -1);
			if (e.target.classList.contains('cart-item__remove')) removeFromCart(id);
		});
	}

	// Checkout hand-off (no backend — this is a static catalog)
	var checkoutBtn = document.querySelector('.cart-drawer__checkout');
	if (checkoutBtn) {
		checkoutBtn.addEventListener('click', function () {
			var confirmEl = document.querySelector('.cart-confirm');
			if (confirmEl) confirmEl.classList.add('show');
		});
	}

	// Mobile nav toggle
	var navToggle = document.querySelector('.nav-toggle');
	var nav = document.querySelector('.main-navigation');
	if (navToggle && nav) {
		navToggle.addEventListener('click', function () {
			nav.classList.toggle('open');
		});
	}

	// Shop category filters
	var filterBtns = document.querySelectorAll('.fg-filter-btn');
	var productCards = document.querySelectorAll('.product-card');
	filterBtns.forEach(function (btn) {
		btn.addEventListener('click', function () {
			var cat = btn.getAttribute('data-filter');
			filterBtns.forEach(function (b) { b.classList.remove('active'); });
			btn.classList.add('active');
			productCards.forEach(function (card) {
				var cats = (card.getAttribute('data-categories') || '').split(',');
				card.style.display = (cat === 'all' || cats.indexOf(cat) !== -1) ? '' : 'none';
			});
		});
	});

	// Category tiles on the homepage link into the shop filter
	document.querySelectorAll('.fg-category-card[data-filter]').forEach(function (card) {
		card.addEventListener('click', function (e) {
			e.preventDefault();
			var cat = card.getAttribute('data-filter');
			window.location.href = 'shop.html?cat=' + encodeURIComponent(cat);
		});
	});

	// On the shop page, apply ?cat= from the URL
	var params = new URLSearchParams(window.location.search);
	var initialCat = params.get('cat');
	if (initialCat) {
		var match = document.querySelector('.fg-filter-btn[data-filter="' + initialCat + '"]');
		if (match) match.click();
	}

	// Newsletter form (no backend — just a friendly confirmation)
	document.querySelectorAll('.fg-newsletter-form').forEach(function (form) {
		form.addEventListener('submit', function (e) {
			e.preventDefault();
			var btn = form.querySelector('button');
			if (btn) btn.textContent = 'Thanks — check your inbox!';
			form.reset();
		});
	});

	// Contact form (no backend — just a friendly confirmation)
	var contactForm = document.querySelector('.fg-form');
	if (contactForm) {
		contactForm.addEventListener('submit', function (e) {
			e.preventDefault();
			var note = contactForm.querySelector('.fg-form-note');
			if (note) note.textContent = "Thanks! We'll get back to you within one business day.";
			contactForm.reset();
		});
	}

	updateCartBadge();
}

if (!window.FG_DEFER_INIT) {
	document.addEventListener('DOMContentLoaded', fgInit);
}
