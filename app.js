/******************************
 * MICROGREENS ORDER PROCESSOR - FRONTEND JS *
 ******************************/

// ========== QR Code library handling with robust loading ========== //
let qrCodeLoaded = typeof QRCode !== 'undefined';

// Load QRCode library dynamically if not present
if (!qrCodeLoaded) {
    console.log('QRCode library not loaded - loading dynamically');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'; // ✅ correct library
    script.onload = () => {
        qrCodeLoaded = true;
        console.log('QRCode library successfully loaded');

        // If modal is open and step = 3, generate QR
        if (isCheckoutStepThree()) {
            generatePaymentQRCode();
        }
    };
    script.onerror = () => {
        console.error('Failed to load QRCode library');
    };
    document.head.appendChild(script);
}
// ========== CONFIGURATION & DATA ========== //
console.log('Initializing microgreens application');
const storedCart = localStorage.getItem('microgreensCart');
console.log('Initial cart from localStorage:', storedCart ? JSON.parse(storedCart) : []);

// Product data with 15% increased prices (from your original code)
// Google Sheets API Configuration (REPLACE WITH YOUR DEPLOYMENT ID)
const GOOGLE_SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbyaXzkzgg7-02Pr3uP57ComlaPPRsT4VBYDvSkGrc8qDQwchMuiJQeCRN6Amc9VLLKb/exec?action=all";

// Global variable to hold product data (will be fetched from Google Sheets API)
let productData = {};

/**
 * Fetch product data from Google Sheets via Apps Script API
 * Called on page load to populate all products and reviews
 */
async function fetchProductDataFromSheets() {
  try {
    console.log('Fetching product data from Google Sheets...');
    
    const response = await fetch(GOOGLE_SHEETS_API_URL);
    const result = await response.json();

    if (result.success && result.data) {
      productData = result.data;
      console.log('✓ Product data loaded from Google Sheets:', Object.keys(productData).length, 'products');
      return productData;
    } else {
      console.warn('Google Sheets API returned error or no data:', result);
      loadFallbackData();
    }
  } catch (error) {
    console.warn('Failed to fetch from Google Sheets API:', error.message);
    loadFallbackData();
  }
}

/**
 * Fallback: Use hardcoded product data if Google Sheets API is unavailable
 * This ensures the website remains functional even if the API fails
 */
function loadFallbackData() {
  console.log('Loading fallback product data (hardcoded)...');
  
  productData = {
    "Sunflower Microgreens": {
        image: "images/sunflower.jpg",
        price: 100,
        description: "Sunflower microgreens are packed with nutrients and have a delightful crunchy texture.",
        rating: 5,
        reviews: 248,
        benefits: [
            "High in protein for energy and muscle repair",
            "Rich in vitamin E and B6 for skin and brain health",
            "Contains magnesium and zinc for immune support",
            "Excellent source of healthy fats and amino acids"
        ],
        usage: [
            "Add to salads for extra crunch",
            "Top avocado toast for nutrition boost",
            "Blend into smoothies for protein",
            "Use as garnish for soups and curries"
        ],
        customerReviews: [
            { name: "Priya M.", rating: 5, text: "Absolutely fresh and packed with nutrients! Highly recommend.", date: "2 weeks ago" },
            { name: "Amit K.", rating: 5, text: "Great quality microgreens. Perfect for my smoothie bowls.", date: "1 week ago" },
            { name: "Sneha P.", rating: 4, text: "Good taste and freshness. Quick delivery to Bangalore.", date: "3 days ago" }
        ]
    },
    "Radish Microgreens": {
        image: "images/radish.jpg",
        price: 100,
        description: "Spicy radish microgreens add a kick to any dish while providing powerful nutrients.",
        rating: 4.5,
        reviews: 156,
        benefits: [
            "High in vitamin C for immune support",
            "Contains sulforaphane, a potent antioxidant",
            "Supports healthy digestion",
            "May help regulate blood pressure"
        ],
        usage: [
            "Add to tacos and sandwiches for spice",
            "Mix into stir-fries at the last minute",
            "Combine with milder greens in salads",
            "Use as garnish for Asian dishes"
        ],
        customerReviews: [
            { name: "Rajesh T.", rating: 5, text: "Love the spicy kick! Amazing for my salads.", date: "1 week ago" },
            { name: "Anjali S.", rating: 4, text: "Very fresh. A bit spicier than expected but tasty.", date: "5 days ago" },
            { name: "Vikram D.", rating: 4, text: "Decent quality. Will order again.", date: "2 days ago" }
        ]
    },
    "Mustard Microgreens": {
        image: "images/mustard.png",
        price: 90,
        description: "Mustard microgreens bring bold flavor and impressive health benefits.",
        rating: 5,
        reviews: 89,
        benefits: [
            "Rich in Vitamin K for bone health",
            "Contains compounds that support detoxification",
            "May help boost metabolism",
            "High in antioxidants"
        ],
        usage: [
            "Add to sandwiches for a flavor punch",
            "Mix into egg dishes like omelets",
            "Combine with cheese plates",
            "Use sparingly in dressings"
        ],
        customerReviews: [
            { name: "Deepak M.", rating: 5, text: "Perfect bold flavor. Exactly what I wanted!", date: "1 week ago" },
            { name: "Riya K.", rating: 5, text: "Excellent quality and taste. Highly satisfactory.", date: "4 days ago" },
            { name: "Nikhil R.", rating: 5, text: "Best microgreens I've had. Definitely ordering again.", date: "2 days ago" }
        ]
    },
    "Wheat Grass": {
        image: "images/wheat-grass.jpg",
        price: 120,
        description: "Wheat grass is a nutrient-packed superfood known for its high chlorophyll content and detoxifying properties.",
        rating: 5,
        reviews: 312,
        benefits: [
            "Rich in chlorophyll which supports blood health",
            "Contains 17 amino acids for protein building",
            "High in vitamins A, C, and E for immunity",
            "Powerful detoxifier and alkalizing agent"
        ],
        usage: [
            "Juice with lemon and ginger for a health shot",
            "Add to smoothies for nutrient boost",
            "Mix with water as a daily detox drink",
            "Use in salads for texture and nutrition"
        ],
        customerReviews: [
            { name: "Anu V.", rating: 5, text: "Amazing health benefits! I feel energized after drinking.", date: "1 week ago" },
            { name: "Sanjay K.", rating: 5, text: "Fresh and potent. Great for my morning routine.", date: "3 days ago" },
            { name: "Meera G.", rating: 5, text: "Excellent quality. Worth every penny for the health benefits.", date: "1 day ago" }
        ]
    },
    "Mixed Microgreens": {
        image: "images/mixed.jpg",
        price: 120,
        description: "Our mixed microgreens provide a variety of flavors and nutrients in one convenient package.",
        rating: 4.5,
        reviews: 127,
        benefits: [
            "Provides diverse range of nutrients",
            "Offers multiple health benefits in one serving",
            "Contains variety of antioxidants",
            "Supports overall health and wellness"
        ],
        usage: [
            "Perfect base for salads",
            "Great addition to wraps and sandwiches",
            "Use as pizza topping after baking",
            "Mix into grain bowls for extra nutrition"
        ],
        customerReviews: [
            { name: "Sarah D.", rating: 5, text: "Love the variety! Great mix of flavors.", date: "5 days ago" },
            { name: "Karan P.", rating: 4, text: "Good mix of microgreens. Stays fresh for days.", date: "2 days ago" },
            { name: "Neha S.", rating: 4, text: "Versatile and healthy. Perfect for my salads.", date: "1 day ago" }
        ]
    }
  };
}

// Recipe data
const recipeData = {
    "Microgreens Avocado Toast": {
        image: "images/avocado-toast.jpg",
        description: "A nutritious and delicious breakfast option packed with healthy fats and microgreen nutrients.",
        ingredients: [
            "2 slices whole grain bread",
            "1 ripe avocado",
            "50g sunflower microgreens",
            "1 tbsp lemon juice",
            "Salt and pepper to taste",
            "Red pepper flakes (optional)"
        ],
        instructions: [
            "Toast the bread until golden and crisp.",
            "Mash the avocado with lemon juice, salt, and pepper.",
            "Spread the avocado mixture evenly on the toast.",
            "Top generously with sunflower microgreens.",
            "Sprinkle with red pepper flakes if desired.",
            "Serve immediately and enjoy!"
        ],
        benefits: [
            "Rich in healthy monounsaturated fats from avocado",
            "High in fiber for digestive health",
            "Packed with vitamins and minerals from microgreens",
            "Provides sustained energy throughout the morning"
        ]
    },
    "Sunflower Green Smoothie": {
        image: "images/sunflower-smoothie.jpg",
        description: "A protein-packed smoothie that's perfect for post-workout recovery or a nutritious breakfast.",
        ingredients: [
            "1 banana",
            "1 cup almond milk",
            "50g sunflower microgreens",
            "1 tbsp almond butter",
            "1 tsp honey (optional)",
            "Ice cubes"
        ],
        instructions: [
            "Add all ingredients to a blender.",
            "Blend until smooth and creamy.",
            "Add more almond milk if needed for desired consistency.",
            "Pour into a glass and enjoy immediately."
        ],
        benefits: [
            "High in plant-based protein",
            "Rich in vitamins and minerals",
            "Great for muscle recovery",
            "Provides sustained energy"
        ]
    },
    "Microgreen Buddha Bowl": {
        image: "images/buddha-bowl.jpg",
        description: "A colorful and nutritious bowl packed with wholesome ingredients and fresh microgreens.",
        ingredients: [
            "1 cup cooked quinoa",
            "50g mixed microgreens",
            "1/2 avocado, sliced",
            "1/2 cup chickpeas",
            "1/4 cup shredded carrots",
            "1/4 cup sliced cucumber",
            "2 tbsp tahini dressing"
        ],
        instructions: [
            "Arrange quinoa at the bottom of a bowl.",
            "Add microgreens, avocado, chickpeas, carrots, and cucumber.",
            "Drizzle with tahini dressing.",
            "Toss gently before eating or enjoy as arranged."
        ],
        benefits: [
            "Complete plant-based meal",
            "High in fiber and protein",
            "Packed with vitamins and antioxidants",
            "Supports gut health"
        ]
    },
    "Radish Microgreen Salad": {
        image: "images/radish-salad.jpg",
        description: "A refreshing and spicy salad with radish microgreens as the star ingredient.",
        ingredients: [
            "50g radish microgreens",
            "1 cup mixed salad greens",
            "1/2 cup cherry tomatoes, halved",
            "1/4 cup sliced radishes",
            "2 tbsp olive oil",
            "1 tbsp lemon juice",
            "Salt and pepper to taste"
        ],
        instructions: [
            "Combine radish microgreens, salad greens, tomatoes, and radishes in a bowl.",
            "Whisk together olive oil, lemon juice, salt, and pepper.",
            "Drizzle dressing over salad and toss gently.",
            "Serve immediately for maximum freshness."
        ],
        benefits: [
            "High in vitamin C",
            "Supports digestion",
            "Low calorie but nutrient-dense",
            "Antioxidant-rich"
        ]
    }
};

// Google Apps Script endpoint (REPLACE WITH YOUR DEPLOYED WEB APP URL)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyaXzkzgg7-02Pr3uP57ComlaPPRsT4VBYDvSkGrc8qDQwchMuiJQeCRN6Amc9VLLKb/exec";

// Cart functionality
let cart = [];
let currentCheckoutStep = 1; // Tracks current step in checkout modal

// ========== INITIALIZATION ========== //
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM fully loaded - initializing application');

    // Initialize cart from localStorage or empty array
    cart = storedCart ? JSON.parse(storedCart) : [];
    console.log('Cart initialized with:', cart);

    // CRITICAL: Fetch product data from Google Sheets BEFORE initializing UI
    // This ensures all product info and reviews are available when needed
    await fetchProductDataFromSheets();

    initializeModal();
    initializeCart();
    setupProductQuantity(); // Setup quantity controls for all product cards
    setupCheckout(); // Setup checkout button listeners
    updateCartDisplay(); // Initial display of cart items

    loadLogo();
                initFloatingWhatsApp();
                initContactModal();
                initWhatsAppBadge();
                initWhatsAppVisibilityOnInput();
                initWhatsAppDismiss();
                initReviewsModal();
});

            // Dismiss behavior: allow users to hide the floating WA button and persist that choice
            function initWhatsAppDismiss() {
                const wa = document.getElementById('floating-whatsapp');
                const btn = document.getElementById('wa-dismiss');
                if (!wa || !btn) return;

                // Ensure button is visible initially
                wa.style.display = 'inline-flex';
                wa.style.opacity = '1';
                wa.style.visibility = 'visible';

                // Apply persisted state ONLY if explicitly dismissed
                try {
                    const dismissed = localStorage.getItem('waDismissed');
                    if (dismissed === '1') {
                        wa.style.display = 'none';
                        return;
                    }
                } catch (e) {
                    console.log('localStorage not available', e);
                }

                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    try { localStorage.setItem('waDismissed', '1'); } catch (er) {}
                    wa.style.transition = 'opacity 200ms ease, transform 200ms ease';
                    wa.style.opacity = '0';
                    wa.style.transform = 'scale(0.9) translateY(6px)';
                    setTimeout(() => { wa.style.display = 'none'; }, 220);
                });

                // Provide a simple way to revive the button: double-tap footer to show again (non-intrusive)
                const footer = document.querySelector('footer');
                if (footer) {
                    let lastTap = 0;
                    footer.addEventListener('click', function() {
                        const now = Date.now();
                        if (now - lastTap < 400) {
                            try { localStorage.removeItem('waDismissed'); } catch (e) {}
                            wa.style.display = 'inline-flex';
                            wa.style.opacity = '1';
                            wa.style.transform = '';
                        }
                        lastTap = now;
                    });
                }
            }

            // Hide floating WhatsApp when keyboard is open or inputs are focused (mobile)
            function initWhatsAppVisibilityOnInput() {
                const wa = document.getElementById('floating-whatsapp');
                if (!wa) return;

                const hide = () => {
                    wa.style.transition = 'opacity 160ms ease';
                    wa.style.opacity = '0';
                    wa.style.pointerEvents = 'none';
                };
                const show = () => {
                    wa.style.opacity = '';
                    wa.style.pointerEvents = '';
                };

                document.addEventListener('focusin', (e) => {
                    const t = e.target;
                    if (!t) return;
                    const tag = t.tagName;
                    if (tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable) {
                        hide();
                    }
                });
                document.addEventListener('focusout', () => {
                    // small timeout to let keyboard dismiss
                    setTimeout(show, 120);
                });

                // visualViewport resize often indicates virtual keyboard open on mobile
                if (window.visualViewport) {
                    let prevHeight = window.visualViewport.height;
                    window.visualViewport.addEventListener('resize', () => {
                        const curr = window.visualViewport.height;
                        if (curr < prevHeight - 100) {
                            hide();
                        } else {
                            show();
                        }
                        prevHeight = curr;
                    });
                }
            }

// Contact modal initialization
function initContactModal() {
    const navContact = document.getElementById('nav-contact');
    const modal = document.getElementById('contact-modal');
    const closeBtn = modal ? modal.querySelector('.close-modal') : null;

    if (navContact && modal) {
        navContact.addEventListener('click', function(e) {
            e.preventDefault();
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }

    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Form behavior
    const form = document.getElementById('contact-form');
    const sendWa = document.getElementById('contact-send-whatsapp');
    if (sendWa) {
        sendWa.addEventListener('click', function() {
            const name = document.getElementById('contact-name').value.trim();
            const phone = document.getElementById('contact-phone').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const msg = document.getElementById('contact-message').value.trim();

            // Basic validation
            if (!name || !phone || !msg) {
                showErrorNotification('Please fill Name, Phone and Message before sending via WhatsApp.');
                return;
            }

            const message = `Hello, my name is ${name}. ${msg} ${phone ? 'Phone: ' + phone : ''} ${email ? 'Email: ' + email : ''}`;
            const isMobile = /Mobi|Android/i.test(navigator.userAgent);
            const waMobile = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
            const waWeb = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
            window.open(isMobile ? waMobile : waWeb, '_blank');

            // Clear unread badge after user initiates contact
            setWhatsAppBadge(0);
        });
    }

    if (form) {
        // Disable direct form POST for now - prefer WhatsApp contact
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            showErrorNotification('Please use "Send via WhatsApp" to contact us.');
        });
    }
}

// WhatsApp badge helpers
function setWhatsAppBadge(count) {
    try {
        localStorage.setItem('waBadgeCount', String(count));
    } catch (e) {}
    const el = document.getElementById('wa-badge');
    if (!el) return;
    if (!count || Number(count) <= 0) {
        el.classList.add('hidden');
    } else {
        el.classList.remove('hidden');
        el.textContent = String(count);
    }
}

function initWhatsAppBadge() {
    let count = 0;
    try { count = Number(localStorage.getItem('waBadgeCount') || '0'); } catch (e) { count = 0; }
    setWhatsAppBadge(count);
}

// Floating WhatsApp handler
const WHATSAPP_NUMBER = '918073047946'; // Business number in international format without +
function initFloatingWhatsApp() {
    const el = document.getElementById('floating-whatsapp');
    if (!el) return;
    el.addEventListener('click', function(e) {
        e.preventDefault();
        const message = 'Hi Aishaura, I have a question about my order.';
        // Prefer whatsapp protocol on mobile, fallback to web link
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        const mobileUrl = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
        const webUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        const url = isMobile ? mobileUrl : webUrl;
        // Clear badge when user initiates contact
        setWhatsAppBadge(0);
        window.open(url, '_blank');
    });
}

// ========== REVIEWS MODAL ========== //
function initReviewsModal() {
    const reviewsBtn = document.querySelectorAll('.card-rating');
    const reviewsModal = document.getElementById('reviews-modal');
    const closeBtn = reviewsModal.querySelector('.close-modal');

    if (!reviewsBtn.length) return;

    // Close button functionality
    closeBtn.addEventListener('click', function() {
        reviewsModal.style.display = 'none';
    });

    // Click outside modal to close
    window.addEventListener('click', function(e) {
        if (e.target === reviewsModal) {
            reviewsModal.style.display = 'none';
        }
    });

    // Add click listener to each product rating
    reviewsBtn.forEach(ratingDiv => {
        ratingDiv.style.cursor = 'pointer';
        ratingDiv.addEventListener('click', function() {
            const productCard = ratingDiv.closest('.card');
            const productName = productCard.querySelector('.gallery-title').textContent;
            const product = productData[productName];

            if (!product) return;

            // Populate modal with product data
            document.getElementById('reviews-product-name').textContent = productName;
            document.getElementById('reviews-average-rating').textContent = '⭐ ' + product.rating + '/5';
            document.getElementById('reviews-count').textContent = product.reviews + ' reviews';

            const reviewsList = document.getElementById('reviews-list');
            reviewsList.innerHTML = '';

            if (product.customerReviews && product.customerReviews.length > 0) {
                product.customerReviews.forEach(review => {
                    const reviewDiv = document.createElement('div');
                    reviewDiv.className = 'review-item';
                    const stars = '⭐'.repeat(review.rating);
                    reviewDiv.innerHTML = `
                        <div class="review-meta">
                            <span class="review-name">${review.name}</span>
                            <span class="review-date">${review.date}</span>
                        </div>
                        <div class="review-stars">${stars}</div>
                        <div class="review-text">${review.text}</div>
                    `;
                    reviewsList.appendChild(reviewDiv);
                });
            } else {
                reviewsList.innerHTML = '<div class="no-reviews">No reviews yet. Be the first to review!</div>';
            }

            // Show modal
            reviewsModal.style.display = 'block';
        });

        // Add hover effect to indicate interactivity
        ratingDiv.addEventListener('mouseenter', function() {
            ratingDiv.style.opacity = '0.7';
        });

        ratingDiv.addEventListener('mouseleave', function() {
            ratingDiv.style.opacity = '1';
        });
    });
}

// ========== LOGO LOADING ========== //
function loadLogo() {
    const logoExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
    const logoBasePath = 'images/generated-image.';
    const logoImg = document.getElementById('logo-img');

    (function tryLogo(i = 0) {
        if (i >= logoExtensions.length) {
            logoImg.alt = "Logo not found";
            logoImg.style.display = "none";
            return;
        }
        const ext = logoExtensions[i];
        const testImg = new Image();
        testImg.onload = function() {
            logoImg.src = logoBasePath + ext;
            logoImg.style.display = "inline";
        };
        testImg.onerror = function() {
            tryLogo(i + 1);
        };
        testImg.src = logoBasePath + ext;
    })();
}

// ========== MODAL FUNCTIONS (Product & Recipe Details) ========== //
function initializeModal() {
    const modal = document.getElementById('product-modal');
    const closeBtn = document.querySelector('.close-modal');

    // Add click event to all product cards
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Prevent modal from opening if quantity buttons or add to cart button are clicked
            if (e.target.closest('.quantity-selector') || e.target.closest('.add-to-cart')) {
                return;
            }

            const productName = this.querySelector('.gallery-title').textContent;
            const product = productData[productName];

            if (product) {
                document.getElementById('modal-image').src = product.image;
                document.getElementById('modal-image').alt = productName;
                document.getElementById('modal-title').textContent = productName;
                document.getElementById('modal-price').textContent = `₹${product.price} per 50g`;
                document.getElementById('modal-description').textContent = product.description;

                const benefitsList = document.getElementById('modal-benefits');
                benefitsList.innerHTML = '';
                product.benefits.forEach(benefit => {
                    const li = document.createElement('li');
                    li.textContent = benefit;
                    benefitsList.appendChild(li);
                });

                const usageList = document.getElementById('modal-usage');
                usageList.innerHTML = '<h3>Usage Tips</h3>'; // Clear previous content and add heading
                const productUsageList = document.createElement('ul');
                product.usage.forEach(use => {
                    const li = document.createElement('li');
                    li.textContent = use;
                    productUsageList.appendChild(li);
                });
                usageList.appendChild(productUsageList);

                // Set initial quantity to 50g for modal add to cart
                document.querySelector('#product-modal .quantity-input').value = 50;

                document.getElementById('add-to-cart-modal').onclick = function() {
                    const quantity = parseInt(document.querySelector('#product-modal .quantity-input').value);
                    addToCart(productName, quantity, product.price);
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto'; // Re-enable scrolling
                };

                document.querySelector('#product-modal .quantity-selector').style.display = 'flex';
                document.getElementById('add-to-cart-modal').style.display = 'block';

                modal.style.display = 'block';
                document.body.style.overflow = 'hidden'; // Disable background scrolling
            }
        });
    });

    // Add click event to all recipe cards
    document.querySelectorAll('.recipe-art').forEach(recipeCard => {
        recipeCard.addEventListener('click', function() {
            const recipeName = this.querySelector('.gallery-title').textContent;
            const recipe = recipeData[recipeName];

            if (recipe) {
                document.getElementById('modal-image').src = recipe.image;
                document.getElementById('modal-image').alt = recipeName;
                document.getElementById('modal-title').textContent = recipeName;
                document.getElementById('modal-price').textContent = ''; // Recipes don't have a price
                document.getElementById('modal-description').textContent = recipe.description;

                const benefitsList = document.getElementById('modal-benefits');
                benefitsList.innerHTML = '<h3>Benefits</h3>'; // Clear previous content and add heading
                const recipeBenefitsList = document.createElement('ul');
                recipe.benefits.forEach(benefit => {
                    const li = document.createElement('li');
                    li.textContent = benefit;
                    recipeBenefitsList.appendChild(li);
                });
                benefitsList.appendChild(recipeBenefitsList);

                const usageList = document.getElementById('modal-usage');
                usageList.innerHTML = '<h3>Ingredients</h3>';
                const ingredientsList = document.createElement('ul');
                recipe.ingredients.forEach(ingredient => {
                    const li = document.createElement('li');
                    li.textContent = ingredient;
                    ingredientsList.appendChild(li);
                });
                usageList.appendChild(ingredientsList);

                usageList.innerHTML += '<h3>Instructions</h3>';
                const instructionsList = document.createElement('ol');
                recipe.instructions.forEach(instruction => {
                    const li = document.createElement('li');
                    li.textContent = instruction;
                    instructionsList.appendChild(li);
                });
                usageList.appendChild(instructionsList);

                document.querySelector('#product-modal .quantity-selector').style.display = 'none';
                document.getElementById('add-to-cart-modal').style.display = 'none';

                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        });
    });

    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    // Close modal if clicking outside content
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

// ========== CART FUNCTIONS ========== //
function initializeCart() {
    document.getElementById('cart-icon').addEventListener('click', function(event) {
        event.stopPropagation(); // Prevent document click from closing it immediately
        document.getElementById('cart-dropdown').classList.toggle('show');
    });

    // Close cart dropdown if clicking outside
    document.addEventListener('click', function(event) {
        const cartContainer = document.getElementById('cart-container');
        const cartDropdown = document.getElementById('cart-dropdown');
        if (cartDropdown.classList.contains('show') && !cartContainer.contains(event.target)) {
            cartDropdown.classList.remove('show');
        }
    });

    document.getElementById('clear-cart').addEventListener('click', clearCart);

    document.getElementById('view-cart').addEventListener('click', function() {
        showCheckoutModal();
        document.getElementById('cart-dropdown').classList.remove('show');
    });

    document.getElementById('checkout-btn').addEventListener('click', function() {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        showCheckoutModal();
        document.getElementById('cart-dropdown').classList.remove('show');
    });
}

function setupProductQuantity() {
    console.log('Setting up product quantity controls');

    // Re-attach event listeners by cloning and replacing, or use event delegation
    // Using event delegation for efficiency and robustness
    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('quantity-btn')) {
            const btn = e.target;
            const input = btn.parentElement.querySelector('.quantity-input');
            let value = parseInt(input.value);
            const step = parseInt(input.step) || 50; // Default step to 50 if not set
            const min = parseInt(input.min) || 50;   // Default min to 50 if not set

            value = btn.classList.contains('minus')
                ? Math.max(min, value - step)
                : value + step;

            input.value = value;
        } else if (e.target.classList.contains('add-to-cart')) {
            const btn = e.target;
            const product = btn.getAttribute('data-product');
            const price = parseFloat(btn.getAttribute('data-price'));
            const quantity = parseInt(btn.parentElement.querySelector('.quantity-input').value);

            addToCart(product, quantity, price);
        }
    });
}

function addToCart(product, quantity, price) {
    console.log('Adding to cart:', { product, quantity, price });

    if (!product || !productData[product]) {
        console.error('Invalid product:', product);
        return;
    }

    quantity = Math.max(50, parseInt(quantity) || 50); // Ensure minimum quantity of 50g
    price = parseFloat(price) || productData[product].price;

    const existingIndex = cart.findIndex(item => item.product === product);
    if (existingIndex >= 0) {
        // If product exists, update quantity
        cart[existingIndex].quantity = quantity;
    } else {
        // Otherwise, add new item
        cart.push({ product, quantity, price });
    }

    localStorage.setItem('microgreensCart', JSON.stringify(cart));
    updateCartDisplay();
    showCartNotification(`${quantity}g of ${product} added to cart`);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('microgreensCart', JSON.stringify(cart));
    updateCartDisplay();
    if (cart.length === 0) {
        document.getElementById('checkout-modal').style.display = 'none'; // Close checkout if cart empty
        document.body.style.overflow = 'auto';
    }
}

// updateItemQuantity function (not used in current UI but kept for completeness if needed)
function updateItemQuantity(index, newQuantity) {
    if (newQuantity >= 50) {
        cart[index].quantity = newQuantity;
        localStorage.setItem('microgreensCart', JSON.stringify(cart));
        updateCartDisplay();
    }
}

function clearCart() {
    cart = [];
    localStorage.removeItem('microgreensCart');
    updateCartDisplay();
    document.getElementById('cart-dropdown').classList.remove('show');
    // Note: Modal will be closed when user clicks "Continue Shopping" button
}

function updateCartDisplay() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartDelivery = document.getElementById('cart-delivery');
    const cartTotal = document.getElementById('cart-total');

    cartCount.textContent = cart.length;
    cartItems.innerHTML = '';

    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align:center; color:#666;">Your cart is empty</p>';
        cartSubtotal.textContent = '₹0';
        cartDelivery.textContent = 'FREE';
        cartTotal.textContent = 'Total: ₹0';
        return;
    }

    let subtotal = 0;

    cart.forEach((item, index) => {
        const itemPrice = (item.quantity / 50) * item.price; // Price per 50g
        subtotal += itemPrice;

        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';

        itemElement.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.product}</h4>
                <div>${item.quantity}g @ ₹${item.price}/50g</div>
                <div class="item-total">₹${itemPrice.toFixed(2)}</div>
            </div>
            <button class="remove-item" data-index="${index}">×</button>
        `;

        cartItems.appendChild(itemElement);
    });

    const total = subtotal; // Assuming delivery is always free

    cartSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
    cartDelivery.textContent = 'FREE'; // Hardcoded as free
    cartTotal.innerHTML = `<span>Total:</span> <span>₹${total.toFixed(2)}</span>`;

    // Re-attach event listeners for remove buttons
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            removeFromCart(index);
        });
    });
}

function calculateOrderTotal() {
    console.log('Calculating order total from cart:', cart);
    const subtotal = cart.reduce((total, item) => {
        const itemTotal = (item.quantity / 50) * item.price;
        console.log(`Calculating: ${item.product} - ${item.quantity}g @ ₹${item.price}/50g = ₹${itemTotal.toFixed(2)}`);
        return total + itemTotal;
    }, 0);
    console.log('Final subtotal:', subtotal);
    return subtotal;
}

function showCartNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10); // Small delay to trigger CSS transition

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300); // Wait for transition to finish before removing
    }, 3000); // Display for 3 seconds
}


// ========== CHECKOUT FUNCTIONS ========== //
function showCheckoutModal() {
    document.getElementById('checkout-modal').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Disable background scrolling
    showCheckoutStep(1); // Always start from step 1
}

function showCheckoutStep(step) {
    currentCheckoutStep = step;

    // Update step indicators (progress dots)
    document.querySelectorAll('.step').forEach(stepEl => {
        stepEl.classList.remove('active');
        if (parseInt(stepEl.getAttribute('data-step')) <= step) {
            stepEl.classList.add('active');
        }
    });

    // Show/hide step content
    document.querySelectorAll('.checkout-step').forEach(stepEl => {
        stepEl.style.display = 'none';
    });
    document.getElementById(`step-${step}`).style.display = 'block';

    if (step === 1) {
        updateCheckoutItems(); // Update cart summary in step 1
    } else if (step === 3) {
        updatePaymentSummary(); // Update order summary in payment step
        generatePaymentQRCode(); // Generate QR code for payment
    }
}

function setupCheckout() {
    document.getElementById('btn-continue').addEventListener('click', function() {
        if (cart.length === 0) {
            alert('Your cart is empty. Please add items before placing an order.');
            return;
        }
        showCheckoutStep(2); // Go to Customer Info step
    });

    // Back buttons for checkout steps
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', function() {
            const currentStepEl = document.querySelector('.checkout-step[style="display: block;"]');
            const currentStep = parseInt(currentStepEl.id.replace('step-', ''));

            if (currentStep > 1) {
                showCheckoutStep(currentStep - 1);
            } else {
                // If on step 1, close the modal
                document.getElementById('checkout-modal').style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });

   document.getElementById('btn-to-payment').addEventListener('click', function() {
  const res = validateCustomerInfo();
  if (!res.valid) {
    alert(res.message);
    return;
  }
  showCheckoutStep(3);
});

    // Payment option selection
    document.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.payment-option').forEach(opt => {
                opt.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Direct UPI pay button (from current modal, for quick access)
    // document.getElementById('upi-pay-button').addEventListener('click', function() {
    //     const total = calculateOrderTotal();
    //     const upiLink = `upi://pay?pa=shashi.shashi7271@ybl&pn=Aishaura%20Microgreens&am=${total.toFixed(2)}&cu=INR&tn=Microgreens%20Order`;
    //     //window.open(upiLink, '_blank');
    // });

    document.getElementById('btn-place-order').addEventListener('click', submitOrder);

    // Close checkout modal
    document.querySelector('#checkout-modal .close-modal').addEventListener('click', function() {
        document.getElementById('checkout-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
    });
}
function isCheckoutStepThree() {
  const modal = document.getElementById('checkout-modal');
  return modal && modal.style.display === 'block' && currentCheckoutStep === 3;
}


const UPI_ID = '9738560719-0@airtel';
const PAYEE_NAME = 'Aishaura Microgreens';
const UPI_NOTE = 'Microgreens Order';

function generatePaymentQRCode() {
  // ✅ correct container (matches your HTML)
  const qrContainer = document.querySelector('#step-3 #upi-qr-code');

  if (!qrContainer) {
    console.warn('QR container not found in step 3 (#upi-qr-code)');
    return;
  }

  qrContainer.innerHTML = '';

  const total = calculateOrderTotal();
  const upiLink =
    `upi://pay?pa=${encodeURIComponent(UPI_ID)}` +
    `&pn=${encodeURIComponent(PAYEE_NAME)}` +
    `&am=${total.toFixed(2)}` +
    `&cu=INR&tn=${encodeURIComponent(UPI_NOTE)}`;

  if (typeof QRCode === 'undefined') {
    showQRCodeFallback(qrContainer, total);
    return;
  }

  new QRCode(qrContainer, {
    text: upiLink,
    width: 180,
    height: 180,
    correctLevel: QRCode.CorrectLevel.H
  });

  const payBtn = document.getElementById('upi-pay-button');
  if (payBtn) payBtn.onclick = () => window.location.href = upiLink;
}

function showQRCodeFallback(qrContainer, total) {
    // This will be displayed if QR code library isn't loaded or fails.
    qrContainer.innerHTML = `
        <div class="upi-fallback">
            <p>Please send payment to:</p>
            <p class="upi-id">${UPI_ID}</p>
      <p>Amount: ₹${total.toFixed(2)}</p>
      <button id="manual-upi-pay" class="upi-pay-button">Pay with UPI App</button>
    </div>
        </div>
    `;

    document.getElementById('manual-upi-pay').addEventListener('click', function() {
        const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(UPI_NOTE)}`;
        window.open(upiLink, '_blank');
    });
}


function updateCheckoutItems() {
    const itemsContainer = document.getElementById('checkout-items');
    itemsContainer.innerHTML = '';

    let subtotal = 0;

    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';

        const itemPrice = (item.quantity / 50) * item.price;
        subtotal += itemPrice;

        itemElement.innerHTML = `
            <div class="order-item-name">${item.product} (${item.quantity}g)</div>
            <div class="order-item-price">₹${itemPrice.toFixed(2)}</div>
        `;

        itemsContainer.appendChild(itemElement);
    });

    const total = subtotal;

    document.getElementById('checkout-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('checkout-delivery').textContent = 'FREE'; // Hardcoded as free
    document.getElementById('checkout-total').textContent = `₹${total.toFixed(2)}`;
}

function updatePaymentSummary() {
    const container = document.getElementById('payment-order-items');
    container.innerHTML = '';

    const total = cart.reduce((sum, item) => {
        const itemPrice = (item.quantity / 50) * item.price;
        container.innerHTML += `
            <div class="order-item">
                <div class="order-item-name">${item.product} (${item.quantity}g)</div>
                <div class="order-item-price">₹${itemPrice.toFixed(2)}</div>
            </div>
        `;
        return sum + itemPrice;
    }, 0);

    document.getElementById('payment-total').textContent = `₹${total.toFixed(2)}`;
}


// Frontend code


function handleResponse(response) {
  // Process response here
  console.log(response);
}

// ========== ORDER SUBMISSION FUNCTIONS ========== //
// Add this to your app.js
function generateOrderId() {
  const date = new Date();
  return 'ORD-' + 
    date.getFullYear().toString().substr(-2) + 
    (date.getMonth() + 1).toString().padStart(2, '0') + 
    date.getDate().toString().padStart(2, '0') + '-' + 
    Math.floor(1000 + Math.random() * 9000);
}


async function submitOrder() {
  const submitBtn = document.getElementById('btn-place-order');
  const loader = document.getElementById('fullpage-loader');
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Processing...';
  
  // Show full-page loading overlay
  loader.style.display = 'flex';

  try {
    // Prepare order data
    const orderData = {
      name: document.getElementById('customer-name').value.trim(),
      phone: document.getElementById('customer-phone').value.trim(),
      email: document.getElementById('customer-email').value.trim(),
      address: document.getElementById('customer-address').value.trim(),
      notes: document.getElementById('customer-notes').value.trim(),
      payment_method: document.querySelector('.payment-option.active')?.getAttribute('data-method') || 'upi',
      amount: calculateOrderTotal().toFixed(2),
      product: cart.map(item => `${item.product} (${item.quantity}g)`).join(', '),
      quantity: cart.reduce((acc, item) => acc + item.quantity, 0) + 'g'
    };

    // Submit to server
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(orderData)
    });
    

    // Check for empty response
    if (!response.ok) {
      throw new Error(`Server returned ${response.status} status`);
    }

    // Parse JSON response
  const result = await response.json();

        // Verify the ID format
            if (!result.orderId.includes('AM-')) {
            console.error('Invalid order ID format:', result.orderId);
            throw new Error('Received invalid order ID from server');
            }

    // Validate response structure
    if (!result || !result.orderId) {
      throw new Error("Missing order ID in response");
    }
console.log("Server response:", result); // Add this before showing alert

    // Show order confirmation page (Step 4) instead of alert
    const totalAmount = parseFloat(result.amount || orderData.amount);
    showOrderConfirmation(result.orderId, totalAmount, orderData.phone);

    // Clear cart after brief delay
    setTimeout(() => {
      clearCart();
      updateCartDisplay();
    }, 1000);

  } catch (error) {
    console.error('Submission error:', error);
    alert(`Order failed: ${error.message}`);
  } finally {
    // Hide loading overlay
    loader.style.display = 'none';
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Place Order';
  }
}

// Helper function to show nice notification
function showSuccessNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'cart-notification success';
  notification.innerHTML = `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
    </svg>
    <span>${message}</span>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }, 10);
}


// ========== VALIDATION FUNCTION ========== //
function validateCustomerInfo() {
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const email = document.getElementById('customer-email').value.trim();
    const address = document.getElementById('customer-address').value.trim();

    if (!name || !phone || !email || !address) {
        return { valid: false, message: "Please fill all required fields." };
    }

    if (phone.length < 10 || !/^\d+$/.test(phone)) {
        return { valid: false, message: "Please enter a valid 10-digit phone number." };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { valid: false, message: "Please enter a valid email address." };
    }

    return { valid: true };
}

// ========== NOTIFICATION FUNCTIONS ========== //
function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <span class="icon">✗</span>
        <span class="message">${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 500);
    }, 3000);
}

// ========== ORDER CONFIRMATION ========== //
function submitOrderViaJsonp(orderData) {
    return new Promise((resolve) => {
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        const script = document.createElement('script');
        
        window[callbackName] = function(data) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(data);
        };

        const params = new URLSearchParams(orderData);
        script.src = GOOGLE_SCRIPT_URL + '?callback=' + callbackName + '&' + params.toString();
        document.body.appendChild(script);
    });
}
// Helper function for form submission fallback
function submitOrderViaFormFallback(orderData) {
    const form = document.createElement('form');
    form.style.display = 'none';
    form.method = 'POST';
    form.action = GOOGLE_SCRIPT_URL;
    form.target = '_blank';

    for (const [key, value] of Object.entries(orderData)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    setTimeout(() => document.body.removeChild(form), 5000);
}

// Helper function for form submission fallback
function submitOrderViaFormFallback(orderData) {
    const form = document.createElement('form');
    form.style.display = 'none';
    form.method = 'POST';
    form.action = GOOGLE_SCRIPT_URL;
   // form.target = '_blank';

    for (const [key, value] of Object.entries(orderData)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    setTimeout(() => document.body.removeChild(form), 5000);
}

// Helper function for showing confirmation
function showOrderConfirmation(orderId, total, phone) {
    document.getElementById('confirmation-id').textContent = `#${orderId}`;
    const numericTotal = typeof total === 'string' ? parseFloat(total) : total;
    document.getElementById('confirmation-total').textContent = `₹${numericTotal.toFixed(2)}`;
    
    // Set up WhatsApp share button
    const whatsappBtn = document.getElementById('share-receipt-whatsapp');
    if (whatsappBtn) {
        whatsappBtn.onclick = () => shareReceiptOnWhatsApp(orderId, numericTotal, phone);
    }
    
    showCheckoutStep(4);
}

// Share receipt on WhatsApp
function shareReceiptOnWhatsApp(orderId, total, phone) {
    const businessPhone = '918073047946'; // Your WhatsApp number
    const message = `Hi! I've placed an order and would like to share the receipt.\n\nOrder ID: #${orderId}\nAmount: ₹${total.toFixed(2)}\n\nPlease confirm receipt of my payment.`;
    
    const whatsappUrl = `https://wa.me/${businessPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}
function renderUpiQr(amount) {
  const upiId = "9738560719-0@airtel";
  const name = "Aishaura Microgreens";
  const upiUrl =
    `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${encodeURIComponent(amount)}&cu=INR`;

  const el = document.getElementById("upi-qr-code");
  if (!el) return;

  // Clear old QR (important when reopening modal)
  el.innerHTML = "";

  new QRCode(el, {
    text: upiUrl,
    width: 180,
    height: 180
  });

  // Optional: open UPI apps on button click
  const btn = document.getElementById("upi-pay-button");
  if (btn) btn.onclick = () => window.location.href = upiUrl;
}



// ========== WHATSAPP CONFIRMATION ========== //
// function sendWhatsAppConfirmation(name, phone, orderId, total, paymentMethod, address, notes) {
//     const cleanedPhone = phone.replace(/\D/g, '');
//     // Ensure the number starts with 91 for India, or add it if missing
//     const whatsappNumber = cleanedPhone.startsWith('91') ? cleanedPhone : `91${cleanedPhone}`;

//     if (whatsappNumber.length >= 10) { // Should be at least 10 digits after cleaning, 12 with 91
//         let message = `Namaskara ${name}! Thank you for your order with Aishaura Microgreens.\n\n`;
//         message += `📦 *Order Confirmation:*\n`;
//         message += `🆔 Order ID: #${orderId}\n`;

//         cart.forEach(item => {
//             message += `🌱 ${item.product}: ${item.quantity}g (₹${item.price}/50g)\n`;
//         });

//         message += `\n💰 *Order Total:* ₹${total.toFixed(2)}\n`;
//         message += `💳 *Payment Method:* ${paymentMethod === 'upi' ? 'UPI' : 'Cash on Delivery'}\n`;
//         message += `🏠 *Delivery Address:* ${address}\n`;

//         if (notes) {
//             message += `📝 *Special Instructions:* ${notes}\n`;
//         }

//         if (paymentMethod === 'upi') {
//             message += `\n*Please complete your UPI payment to:*\n`;
//             message += `UPI ID: shashi.shashi7271@ybl\n`;
//             message += `Amount: ₹${total.toFixed(2)}\n\n`;
//             message += `We'll process your order once payment is confirmed.`;
//         } else {
//             message += `\nWe'll process your order shortly. Please keep cash ready for delivery.`;
//         }

//         message += `\n\nThank you for choosing Aishaura Microgreens!`;

//         const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
//         window.open(whatsappUrl, '_blank');
//     } else {
//         console.warn('Invalid phone number for WhatsApp:', phone);
//     }
// }
