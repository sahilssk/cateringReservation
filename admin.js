// admin.js – Admin Dashboard functionality (fixed version)
document.addEventListener("DOMContentLoaded", () => {
    // Navigation buttons
    const showProductsBtn = document.getElementById("showProductsBtn");
    const showOrdersBtn   = document.getElementById("showOrdersBtn");
    const showProfileBtn  = document.getElementById("showProfileBtn");
    const logoutBtn       = document.getElementById("logoutBtn");
  
    // Sections
    const productSection = document.getElementById("productSection");
    const ordersSection  = document.getElementById("ordersSection");
    const profileSection = document.getElementById("profileSection");
  
    // Cart subsection in product section
    const cartSection   = document.getElementById("cartSection");
    const cartList      = document.getElementById("cartList");
    const cartCount     = document.getElementById("cartCount");
    const viewCartBtn   = document.getElementById("viewCartBtn");
    const placeOrderBtn = document.getElementById("placeOrderBtn");
  
    // Toggle main views
    showProductsBtn.addEventListener("click", () => {
      // Show all products section
      productSection.style.display = "block";
      // Hide other sections
      ordersSection.style.display = "none";
      profileSection.style.display = "none";
      // Reset cart view when switching away
      cartSection.style.display = "none";
    });
  
    showOrdersBtn.addEventListener("click", () => {
      // Show orders section
      productSection.style.display = "none";
      ordersSection.style.display = "block";
      profileSection.style.display = "none";
      // Load the current user's orders
      loadMyOrders();
    });
  
    showProfileBtn.addEventListener("click", () => {
      // Show profile section
      productSection.style.display = "none";
      ordersSection.style.display = "none";
      profileSection.style.display = "block";
      // Pre-fill the email field with logged-in user's email
      const user = auth.currentUser;
      if (user) {
        document.getElementById("profileEmail").value = user.email;
      }
    });
  
    // Logout
    logoutBtn.addEventListener("click", () => {
      auth.signOut().then(() => {
        alert("Logged out!");
        // Redirect to home page
        window.location.href = "index.html";
      }).catch(err => {
        alert("Logout failed: " + err.message);
      });
    });
  
    // List all products (from all vendors) in the admin dashboard
    const productList = document.getElementById("productList");
    const productsMap = {};  // map to store product info for later use (name by product ID)
    db.collection("products")
      .orderBy("timestamp", "desc")
      .get()
      .then(snapshot => {
        productList.innerHTML = "";  // clear any existing content
        snapshot.forEach(doc => {
          const data = doc.data();
          // Save product name for later order display
          productsMap[doc.id] = { name: data.name };
  
          // Create product card element
          const productCard = document.createElement("div");
          productCard.style.border = "1px solid #ccc";
          productCard.style.padding = "10px";
          productCard.style.margin = "10px";
          productCard.style.borderRadius = "8px";
          productCard.style.width = "250px";
          productCard.style.display = "inline-block";
  
          // Product image
          const img = document.createElement("img");
          img.src = data.imageUrl;
          img.alt = data.name;
          img.style.width = "100%";
          img.style.borderRadius = "5px";
  
          // Product name
          const nameElem = document.createElement("h3");
          nameElem.innerText = data.name;
  
          // Product description
          const desc = document.createElement("p");
          desc.innerText = data.description;
  
          // Product price
          const price = document.createElement("strong");
          price.innerText = "₹ " + data.price;
  
          // Quantity input
          const qtyInput = document.createElement("input");
          qtyInput.type = "number";
          qtyInput.min = "1";
          qtyInput.value = "1";
          qtyInput.style.width = "50px";
          qtyInput.style.marginRight = "5px";
  
          // Add-to-Cart button
          const addBtn = document.createElement("button");
          addBtn.innerText = "Add to Cart";
  
          // Handle adding product to cart
          addBtn.addEventListener("click", () => {
            const quantity = parseInt(qtyInput.value) || 1;
            const productId = doc.id;
            // Update cart data
            const existingItem = cart.find(item => item.productId === productId);
            if (existingItem) {
              // If product already in cart, increment quantity
              existingItem.quantity += quantity;
              // Update the cart list display for this item
              const li = document.getElementById("cart-item-" + productId);
              if (li) {
                li.innerText = `${data.name} – Qty: ${existingItem.quantity}`;
              }
            } else {
              // Add new item to cart
              cart.push({ productId: productId, name: data.name, quantity: quantity });
              const li = document.createElement("li");
              li.id = "cart-item-" + productId;
              li.innerText = `${data.name} – Qty: ${quantity}`;
              cartList.appendChild(li);
            }
            // Update cart count (total quantity of items in cart)
            const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.innerText = totalCount;
            alert(`Added ${data.name} (x${quantity}) to cart.`);
          });
  
          // Assemble the product card and append to the list
          productCard.appendChild(img);
          productCard.appendChild(nameElem);
          productCard.appendChild(desc);
          productCard.appendChild(price);
          productCard.appendChild(qtyInput);
          productCard.appendChild(addBtn);
          productList.appendChild(productCard);
        });
      })
      .catch(error => {
        console.error("Error fetching products:", error);
        productList.innerHTML = "<p style='color:red;'>Could not load products.</p>";
      });
  
    // Cart management
    let cart = [];  // array to hold cart items (objects with productId, name, quantity)
  
    // Toggle cart visibility
    viewCartBtn.addEventListener("click", () => {
      if (cartSection.style.display === "none") {
        cartSection.style.display = "block";
      } else {
        cartSection.style.display = "none";
      }
    });
  
    // Place Order: save all cart items as orders in Firestore
    placeOrderBtn.addEventListener("click", () => {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to place orders.");
        return;
      }
      if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
      }
      // Create an order document for each item in the cart
      const promises = cart.map(item => {
        return db.collection("orders").add({
          productId: item.productId,
          userId: user.uid,             // track which user (admin) placed the order
          quantity: item.quantity,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
      Promise.all(promises)
        .then(() => {
          alert("Order placed successfully!");
          // Clear cart UI and data after successful order
          cart = [];
          cartList.innerHTML = "";
          cartCount.innerText = "0";
          cartSection.style.display = "none";
        })
        .catch(err => {
          console.error("Error placing order:", err);
          alert("Error placing order: " + err.message);
        });
    });
  
    // Load and display the current admin user's orders
    function loadMyOrders() {
      const user = auth.currentUser;
      const ordersList = document.getElementById("ordersList");
      ordersList.innerHTML = "Loading your orders...";
      if (!user) return;
  
      // Query the 'orders' collection for orders belonging to this user
      db.collection("orders").where("userId", "==", user.uid).get()
        .then(snapshot => {
          ordersList.innerHTML = "";
          if (snapshot.empty) {
            ordersList.innerHTML = "<li>No orders placed yet.</li>";
            return;
          }
          // Collect orders and sort by timestamp (newest first)
          const myOrders = [];
          snapshot.forEach(doc => {
            myOrders.push(doc.data());
          });
          myOrders.sort((a, b) => {
            if (!a.timestamp || !b.timestamp) return 0;
            return b.timestamp.toDate() - a.timestamp.toDate();
          });
          // Display each order in the orders list
          myOrders.forEach(order => {
            const li = document.createElement("li");
            // Get product name from productsMap (or fallback to productId if not loaded)
            const prodName = productsMap[order.productId]
                             ? productsMap[order.productId].name
                             : "Product " + order.productId;
            let text = `${prodName} – Qty: ${order.quantity}`;
            if (order.timestamp) {
              text += ` (ordered on ${order.timestamp.toDate().toLocaleString()})`;
            }
            li.innerText = text;
            ordersList.appendChild(li);
          });
        })
        .catch(err => {
          console.error("Error loading orders:", err);
          ordersList.innerHTML = "<li style='color:red;'>Failed to load orders.</li>";
        });
    }
  });
  