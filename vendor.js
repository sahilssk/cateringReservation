// vendor.js – Vendor Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    // Navigation Buttons
    const showUploadBtn = document.getElementById("showUploadBtn");
    const showVendorOrdersBtn = document.getElementById("showVendorOrdersBtn");
    const showProfileBtn = document.getElementById("showProfileBtn");
    const logoutBtn = document.getElementById("logoutBtn");
  
    // Sections
    const uploadSection = document.getElementById("uploadSection");
    const vendorOrdersSection = document.getElementById("vendorOrdersSection");
    const profileSection = document.getElementById("profileSection");
  
    // Toggle section visibility
    showUploadBtn.addEventListener("click", () => {
      uploadSection.style.display = "block";
      vendorOrdersSection.style.display = "none";
      profileSection.style.display = "none";
    });
    showVendorOrdersBtn.addEventListener("click", () => {
      uploadSection.style.display = "none";
      vendorOrdersSection.style.display = "block";
      profileSection.style.display = "none";
      loadVendorOrders();  // load orders when this section is shown
    });
    showProfileBtn.addEventListener("click", () => {
      uploadSection.style.display = "none";
      vendorOrdersSection.style.display = "none";
      profileSection.style.display = "block";
      // Fill in current user email in profile section
      const user = auth.currentUser;
      if (user) {
        document.getElementById("profileEmail").value = user.email;
      }
    });
  
    // Logout function
    logoutBtn.addEventListener("click", () => {
      auth.signOut().then(() => {
        alert("Logged out successfully!");
        window.location.href = "index.html";
      }).catch(error => {
        alert("Error logging out: " + error.message);
      });
    });
  
    // Create a container for product list (inside uploadSection)
    const productList = document.createElement("div");
    productList.id = "productList";
    uploadSection.appendChild(productList);
  
    // Display current vendor's uploaded products
    const currentVendor = auth.currentUser;
    if (currentVendor) {
      db.collection("products")
        .where("vendorId", "==", currentVendor.uid)
        .orderBy("timestamp", "desc")
        .get()
        .then(snapshot => {
          productList.innerHTML = "";  // clear list
          snapshot.forEach(doc => {
            const data = doc.data();
            // Create product card
            const productCard = document.createElement("div");
            productCard.style.border = "1px solid #ccc";
            productCard.style.padding = "10px";
            productCard.style.margin = "10px";
            productCard.style.borderRadius = "8px";
            productCard.style.width = "250px";
            productCard.style.display = "inline-block";
            productCard.style.verticalAlign = "top";
  
            const img = document.createElement("img");
            img.src = data.imageUrl;
            img.alt = data.name;
            img.style.width = "100%";
            img.style.height = "auto";
            img.style.borderRadius = "5px";
  
            const name = document.createElement("h3");
            name.innerText = data.name;
  
            const desc = document.createElement("p");
            desc.innerText = data.description;
  
            const price = document.createElement("strong");
            price.innerText = "₹ " + data.price;
  
            productCard.appendChild(img);
            productCard.appendChild(name);
            productCard.appendChild(desc);
            productCard.appendChild(price);
            productList.appendChild(productCard);
          });
        })
        .catch(error => {
          console.error("Error loading products:", error);
        });
    }
  
    // Handle the Upload Product form submission
    const uploadForm = document.getElementById("uploadForm");
    const uploadMsg = document.getElementById("uploadMsg");
    uploadForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in as a vendor to upload products.");
        return;
      }
      // Get form values
      const prodName = document.getElementById("prodName").value.trim();
      const prodDesc = document.getElementById("prodDesc").value.trim();
      const prodPrice = parseFloat(document.getElementById("prodPrice").value);
      const fileInput = document.getElementById("productImage");
      const file = fileInput.files[0];
      if (!file) {
        uploadMsg.style.color = "red";
        uploadMsg.innerText = "Please select an image.";
        return;
      }
      if (isNaN(prodPrice)) {
        uploadMsg.style.color = "red";
        uploadMsg.innerText = "Please enter a valid price.";
        return;
      }
      // Create a new Firestore document for the product
      const productRef = db.collection("products").doc();
      // Upload file to Firebase Storage under "productImages/{docId}"
      const storageRef = storage.ref("productImages/" + productRef.id);
      storageRef.put(file).then(snapshot => {
        // Get downloadable URL for the image
        return snapshot.ref.getDownloadURL();
      }).then(downloadURL => {
        // Save product info in Firestore
        return productRef.set({
          name: prodName,
          description: prodDesc,
          price: prodPrice,
          imageUrl: downloadURL,
          vendorId: user.uid,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      }).then(() => {
        uploadMsg.style.color = "green";
        uploadMsg.innerText = "Product uploaded successfully!";
        uploadForm.reset();
        // Append the new product to the UI list immediately
        const newCard = document.createElement("div");
        newCard.style.border = "1px solid #ccc";
        newCard.style.padding = "10px";
        newCard.style.margin = "10px";
        newCard.style.borderRadius = "8px";
        newCard.style.width = "250px";
        newCard.style.display = "inline-block";
        newCard.style.verticalAlign = "top";
        const img = document.createElement("img");
        img.src = file ? URL.createObjectURL(file) : "";  // using local file preview
        img.alt = prodName;
        img.style.width = "100%";
        img.style.height = "auto";
        img.style.borderRadius = "5px";
        const nameEl = document.createElement("h3");
        nameEl.innerText = prodName;
        const descEl = document.createElement("p");
        descEl.innerText = prodDesc;
        const priceEl = document.createElement("strong");
        priceEl.innerText = "₹ " + prodPrice;
        newCard.appendChild(img);
        newCard.appendChild(nameEl);
        newCard.appendChild(descEl);
        newCard.appendChild(priceEl);
        // Add newest product at the top of the list
        if (productList.firstChild) {
          productList.insertBefore(newCard, productList.firstChild);
        } else {
          productList.appendChild(newCard);
        }
      }).catch(error => {
        console.error("Error uploading product:", error);
        uploadMsg.style.color = "red";
        uploadMsg.innerText = "Error: " + error.message;
      });
    });
  
    // Function to load orders for the current vendor's products
    function loadVendorOrders() {
      const user = auth.currentUser;
      const vendorOrdersList = document.getElementById("vendorOrdersList");
      vendorOrdersList.innerHTML = "<li>Loading orders...</li>";
      if (!user) return;
      // First get all product IDs for this vendor
      db.collection('products').where('vendorId', '==', user.uid).get()
        .then(prodSnap => {
          const productIds = [];
          const productNameMap = {};
          prodSnap.forEach(doc => {
            productIds.push(doc.id);
            productNameMap[doc.id] = doc.data().name;
          });
          if (productIds.length === 0) {
            vendorOrdersList.innerHTML = "<li>No products uploaded yet, so no orders.</li>";
            return;
          }
          // Query orders in batches of up to 10 IDs (Firestore 'in' query limit is 10)
          const queries = [];
          for (let i = 0; i < productIds.length; i += 10) {
            const batch = productIds.slice(i, i + 10);
            queries.push(db.collection('orders').where('productId', 'in', batch).get());
          }
          // Fetch all relevant orders and display them
          return Promise.all(queries).then(snapshots => {
            vendorOrdersList.innerHTML = "";
            let foundAny = false;
            const allOrders = [];
            snapshots.forEach(snap => {
              snap.forEach(orderDoc => {
                foundAny = true;
                const orderData = orderDoc.data();
                allOrders.push(orderData);
              });
            });
            // Sort orders by timestamp (newest first)
            allOrders.sort((a, b) => {
              if (!a.timestamp || !b.timestamp) return 0;
              return b.timestamp.toDate() - a.timestamp.toDate();
            });
            allOrders.forEach(orderData => {
              const prodName = productNameMap[orderData.productId] || "Unknown product";
              const li = document.createElement("li");
              let text = `${prodName} – Qty: ${orderData.quantity}`;
              if (orderData.timestamp) {
                const d = orderData.timestamp.toDate();
                text += ` (ordered on ${d.toLocaleString()})`;
              }
              li.innerText = text;
              vendorOrdersList.appendChild(li);
            });
            if (!foundAny) {
              vendorOrdersList.innerHTML = "<li>No orders placed on your products yet.</li>";
            }
          });
        })
        .catch(error => {
          console.error("Error loading vendor orders:", error);
          vendorOrdersList.innerHTML = "<li style='color:red;'>Failed to load orders.</li>";
        });
    }
  });
  