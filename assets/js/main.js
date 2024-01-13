let url = window.location.pathname;

window.onload = function() {
    // Local Storage
    let filenames = [
        "categories.json",
        "models.json",
        "designers.json",
        "themes.json",
        "colors.json",
        "products.json"
    ];

    filenames.forEach((filename) => {
        fetchData(filename, function (result) {
            setLocalStorage(filename.replace(".json", ""), result);
        });
    });
    
    if (getLocalStorage("shoppingCart") == null) 
        setLocalStorage("shoppingCart", []);
    // else localStorage.removeItem("shoppingCart");

    // Header
    displayHeader();
    numberOfProductInShoppingCart();

    // Footer 
    displayFooter();

    // Shopping Cart
    $("body > header").after(
        `<!-- Shopping Cart -->
		 <section class = "shopping-cart fixed-top vh-100 py-5 pr-5 bg-white">
			 <header class = "pl-5 d-flex flex-row justify-content-between align-items-center">
				 <h3 class = "mb-0 text-uppercase font-family text-spacing">Shopping Cart</h3>
				 <a href = "#" class = "btn-close">
				    <i class = "fa fa-close"></i>
				 </a> 
			 </header>
			 <main class = "my-4"></main>
			 <footer class = "ml-5 pt-4 d-flex flex-column text-center border-top">
				 <div class = "mb-4 d-flex flex-row justify-content-between">
					 <span class = "font-weight-bold">Total for Payment:</span>
					 <span class = "total-shopping-cart-price"></span>
				 </div>
				 <a href = "" class = "w-100 mt-3 btn bg-black text-white">Continue Shopping</a>
				 <a href = "checkout.html" class = "w-100 mt-1 btn bg-black text-white">Go to Checkout</a>
			 </footer>
		 </section>`
    );

    $(".shopping-cart").hide();

    // Open Shopping Cart
    $(`a[data-target = "shopping-cart"]`).click(function(e) {
        e.preventDefault();
        displayShoppingCart();
    });

    // Close Shopping Cart
    $(".btn-close").click(function(e) {
        e.preventDefault();
        $(".shopping-cart").hide();
    });

    if (url.includes("index.html") || url.lastIndexOf("/") == url.length) {
       
    }

    if (url.includes("shop.html")) {
        let max = findProductPrice("max");
        let min = findProductPrice("min");
        $("#price-range").attr("min", min);
        $("#price-range").attr("max", max);
        $("#price-range").attr("value", max);
        $("#lowest-price").text(priceFormatting(min));
        $("#current-price").text(priceFormatting(max));

        fetchData("categories.json", displayCategories);

        fetchData("designers.json", function(result) {
            displayCheckboxList("designers", "designer", result);
        });

        fetchData("themes.json", function(result) {
            displayCheckboxList("themes", "theme", result);
        });

        fetchData("colors.json", displayColors);

        $(".list-group-item header a").click(function(e) {
            e.preventDefault();
            let collapse = $(this).parents(".list-group-item").find("main");
            if (collapse.hasClass("d-none"))
                collapse.removeClass("d-none");
            else 
                collapse.addClass("d-none");
        });
        
        applyProductFilters();

        fetchData("products.json", function(result) {
            displayProducts($("#products"), result);
        });

        let input = $("#search-product-by-name");
        let button = $("#search-product")
        input.css("padding-right", `calc(${button.css("width")} + ${input.css("padding-right")})`)

        $(".layout-option").click(function(e) {
            e.preventDefault();
        });
    }

    if (url.includes("single-product.html")) {
        let id = getLocalStorage("singleProduct");
        let products = getLocalStorage("products");
        let designers = getLocalStorage("designers");
        let product = products.filter(el => el.id == id);
        let designer = designers.filter(el => el.id == product[0].designer);

        // Product Details
        displaySingleProduct(id);

        // Similar Products 
        displaySimilarProducts(id, designer[0].id);

        // Slider
        $(".previous, .next").click(function(e) {
            e.preventDefault();
            activate(e, $($(this).data("target")));
        });
    }

    if (url.includes("checkout.html")) {
        $("#order-items").html(
            $(".shopping-cart").html().replace("Shopping Cart Item", "Order Item")
                                      .replace("Shopping Cart", "Order Overview")
        );

        displayShoppingCart();
        $("body > .shopping-cart").hide();

        fetchData("cities.json", displayCities);
    }

    if (url.includes("contact.html") || url.includes("checkout.html")) {
        let fields = formFields.filter(el => el.form == $("form").attr("name"));
        fields = fields[0].fields;
        // Order & Contact Form Validation
        for (let field of fields) {
            let element = $(`[name = ${field}]`);
            element.after(`<p class = "mt-1 mb-0 validation-info font-weight-bold small" data-field = "${field}" data-status = "false"></p>`);
            if (field == "message") {
                element.blur(function() {
                    validateTextarea($(this));
                });
            }
            else if (field == "cities") {
                element.blur(function() {
                    validateSelect($(this));
                });
            }
            else {
                element.blur(function() {
                    validateInput($(this));
                });
            }
        }

        let submitButton = $(`input[type = "submit"]`);
        submitButton.after(`<p class = "w-100 mt-3 mb-0 font-weight-bold small"></p>`); 
        submitButton.click(function(e) {
            e.preventDefault();
            validateForm($(this));
        });
    }

    if (url.includes("about-author.html")) { }
}

function findProductPrice(priceType) {
    let products = getLocalStorage("products");
    let prices = [];
    for (let product of products) {
        prices.push(currentProductPrice(product));
    }
    if (priceType == "max") {
        let max = 0;
        for (let price of prices) {
            if (price >= max)
                max = price;
        }
        return max;
    }
    else {
        let min = findProductPrice("max");
        for (let price of prices) {
            if (price <= min)
                min = price;
        }
        return min;
    }
}

// Slider

function animate(a, b, sliderItems) {
    $(a).css("transform", `translateX(${-sliderItems[0].offsetWidth}px)`);
    $(b).css("transform", `translateX(${sliderItems[0].offsetWidth}px)`);
}

function previous(sliderItems, slider) {
    let sliderTrack = slider.find(".slider-track");
    $(sliderTrack).prepend(sliderItems[sliderItems.length - 1]);
    animate(slider, sliderTrack, sliderItems);
}
  
function next(sliderItems, slider) {
    let sliderTrack = slider.find(".slider-track");
    $(sliderTrack).append(sliderItems[0]);
    animate(sliderTrack, slider, sliderItems);
}

function activate(e, slider) {
    let sliderItems = slider.find(".slider-item");
    $(e.target).closest(".next").length && next(sliderItems, slider);
    $(e.target).closest(".previous").length && previous(sliderItems, slider);
}

// AJAX

function fetchData(filename, callback) {
    $.ajax({
        url: "assets/data/" + filename,
        method: "get",
        dataType: "json",
        success: function(result) {
            callback(result);
        },
        error: function(xhr, status, error) { 
            // Obrada grešaka
        }
    });
} 

// Local Storage

function setLocalStorage(name, value) {
    localStorage.setItem(name, JSON.stringify(value));
}

function getLocalStorage(name) {
    return JSON.parse(localStorage.getItem(name));
}

// Header

function displayHeader() {
    let links = [
        {name: "Home", href: "index.html"},
        {name: "About", href: "about.html"},
        {name: "Shop", href: "shop.html"},
        {name: "Contact", href: "contact.html"}
    ];

    $(".page-header").html(
        `<!-- Logo -->
         <a href = "${url.includes("index.html") || url.lastIndexOf("/") == url.length ? "#" : "index.html"}" class = "logo">
             <img src = "assets/img/logo.png" alt = "The Panda Logo" />
         </a>
         <!-- Navigation Links -->
         <ul class = "main-nav nav-links nav font-weight-bold"></ul>
         <div>
		     <ul class = "nav align-items-center">
				 <li>
					 <a href = "#">
						<i class = "fa fa-user"></i>
					 </a>
				 </li>
				 <li class = "ml-3 mr-4 position-relative">
					 <a class = "" href = "#" data-target = "shopping-cart">
					     <i class = "fa fa-shopping-bag"></i>
					 </a>
					 <span class = "number-of-products position-absolute rounded-circle font-weight-bold bg-black text-white"></span>
				 </li>
				 <li class = "ml-2 small">
				      <a href = "#" class = "mr-1 font-weight-bold">Login</a> / 
					  <a href = "#" class = "ml-1 font-weight-bold">Register</a>
				 </li>
			 </ul>
		 </div>`
    ).addClass("py-4 px-5 d-flex flex-row justify-content-between align-items-center");

    displayList($(".page-header .nav-links"), links);
}

function numberOfProductInShoppingCart() {
    let shoppingCartItems = getLocalStorage("shoppingCart");
    $(".number-of-products").html(shoppingCartItems.length);
}

function displayList(list, links) {
    let html = "";
    for (let link of links) {
        html += `<li ${link.name == "Shop" ? `class = "position-relative"` : ""}>`;
        if (link.href == "index.html" && (url.includes("index.html") || url.lastIndexOf("/") == url.length))
            html += `<a href = "#">${link.name}</a>`;
        else 
            html += `<a href = "${url.includes(link.href) ? "#" : link.href}">${link.name}</a>`;
        if (link.name == "Shop")
            html += `<span class = "badge position-absolute font-family text-danger">NOW</span>`;
        html += "</li>";
    }
    $(list).html(html);
}

// Footer

function displayFooter() {
    let links = [
        {name: "About Author", href: "about-author.html"},
        {name: "Documentation", href: "documentation.pdf"},
        {name: "Sitemap", href: "sitemap.xml"},
    ];

    $(".page-footer").html(
        `<!-- Social Media -->
         <ul class = "social-media nav"></ul>
         <small class = "my-5">Copyright &copy; 2024 The Panda <span class = "px-1">&ndash;</span> Apple iPhone & Samsung Galaxy Phone Cases</small>
         <!-- Navigation Links -->
         <ul class = "nav-links nav font-weight-bold small"></ul>`
    ).addClass("p-5 mt-4 d-flex flex-column align-items-center");

    fetchData("social-media.json", displaySocialMedia);
    displayList($(".page-footer .nav-links"), links);
}

function displaySocialMedia(data) {
    let html = "";
    for (let el of data) {
        html += `<li data-toggle = "tooltip" data-placement = "bottom" title = "${el.name}">
                     <a href = "${el.url}" target = "_blank">
                        <i class = "fa fa-${el.name.toLowerCase()}"></i>
                     </a>
                 </li>`;
    }
    $(".social-media").html(html);
}

// Shop

function displayCategories(data) {
    let html = "";
    for (let category of data) {
        html += `<li>
                     <a href = "#" class = "category d-flex flex-row justify-content-between align-items-center font-weight-bold" data-id = "${category.id}">
                         ${category.name} <i class = "fa fa-angle-down"></i>
                     </a>
                     <ul class = "mt-2 nav flex-column d-none" data-category = "${category.id}"></ul>
                 </li>`;
    }
    $("#categories").html(html);

    $(".category").click(function(e) {
        e.preventDefault();
        let collapse = $(this).next();
        if (collapse.hasClass("d-none"))
            collapse.removeClass("d-none");
        else 
            collapse.addClass("d-none");
    });

    fetchData("models.json", displayModels);
}

function displayModels(data) {
    let html = "";
    let categories = getLocalStorage("categories");
    for (let category of categories) {
        html = "";
        for (let model of data) {
            if (model.category == category.id) {
                html += `<li>
                             <input type = "checkbox" name = "models" class = "model" value = "${model.id}" />
                             <label for = "" class = "mb-0">${model.name}</label>
                         </li>`;
            }
        }
        $(`ul[data-category = ${category.id}]`).html(html);
    }

    $(".model").change(filterChange);
}

function displayCheckboxList(list, inputClass, data) {
    let html = "";
    for (let el of data) {
        html += `<li class = "${inputClass == "designer" || inputClass == "theme" ? "w-50" : ""}">
                     <input type = "checkbox" name = "${list}" class = "${inputClass}" value = "${el.id}" />
                     <label for = "" class = "mb-0">${el.name}</label>
                 </li>`;
    }
    $(`#${list}`).html(html);
    $(`.${inputClass}`).change(filterChange);
}

function displayColors(data) {
    let html = "";
    
    for (let color of data) {
        html += `<li class = "rounded-circle my-1 border d-flex flex-row" style = "background-color: ${color.code}">
                     <a href = "#" class = "w-100 h-100 color rounded-circle" data-id = "${color.id}" data-active = "false" data-toggle = "tooltip" data-placement = "bottom" title = "${color.name}"></a>
                 </li>`;
    }
    $("#colors").html(html);

    $(".color").click(function(e) {
        e.preventDefault();
        if ($(this).data("active") == "true")
            $(this).data("active", "false").html("");
        else 
            $(this).data("active", "true").html(`<i class = "fa fa-check"></i>`);  
        filterChange();
    });
}

function displayProducts(element, data) {
    let html = "";
    let classes = "";

    if (url.includes("shop.html")) {
        classes = "col-3";
        data = filterProductsByPrice(data);
        data = filterProductsByCheckbox("model", data);
        data = filterProductsByCheckbox("designer", data);
        data = filterProductsByCheckbox("theme", data);
        data = filterProductsByColor(data);
        data = searchProductByName(data);
        data = sortProducts(data);
    }
    else if (url.includes("single-product.html") || url.includes("index.html") || url.lastIndexOf("/") == url.length)
        classes = "slider-item";
    
    if (data.length == 0) {
        if (url.includes("shop.html")) {
            html = `<p class = "mb-0">There are no matching products currently.</p>`;
        }
    }
    else {
        for (let product of data) {
            html += `<!-- Product -->
                     <article class = "product card ${classes} p-0 mt-4 text-center border-0" data-id = "${product.id}">
                         <div class = "mb-1 position-relative d-flex flex-row justify-content-center align-items-center">
                             <img src = "assets/img/product/${product.image}" class = "card-img-top mb-0" alt = "${product.name} Phone Case" />
                             ${displayProductBadge(product)}
                             <a href = "${product.models.length == 1 ? "#" : "single-product.html"}" data-product = "${product.id}" class = "rounded-circle position-absolute bg-white d-none">
                                 <i class = "fa fa-shopping-basket"></i>
                             </a>
                         </div>
                         <div class = "card-body p-0">
                              <p class = "mb-1">${displayProductCategory(product.models)}</p>
                              <h6 class = "mb-1 card-title">
                                  <a href = "single-product.html" class = "font-weight-bold" data-product = "${product.id}" data-toggle = "tooltip" data-placement = "bottom" title = "Click for more information">${product.name}</a>
                              </h6>
                              <div class = "product-price d-flex flex-row justify-content-center">${displayProductPrice(product)}</div>
                         </div>
                     </article>`;
        }
    }
    
    element.html(html);

    $(".card-title").click(function() {
        let id = parseInt($(this).data("product"));
        setLocalStorage("singleProduct", id);
    });

    $(".product > div:first-child").mouseout(function() {
        $(this).find("a").html(`<i class = "fa fa-shopping-basket"></i>`);
    });

    $(".product > div:first-child > a").click(function(e) {
        let id = parseInt($(this).data("product"));
        let products = getLocalStorage("products");
        let models = getLocalStorage("models");
        let product = products.filter(el => el.id == id);

        if (product[0].models.length == 1) {
            e.preventDefault();
            $(this).html(`<i class = "fa fa-check text-success"></i>`);
            let model = models.filter(el => el.id == product[0].models[0]);
            addProductToShoppingCart({
                "id": id,
                "model": model[0].name,
                "quantity": 1
            }); 
        }
        else setLocalStorage("singleProduct", id);
    });

    $(".product .card-title").click(function() {
        let id = parseInt($(this).find("a").data("product"));
        setLocalStorage("singleProduct", id);
    });
}

function displayProductBadge(product) {
    if (product.newest)
        return `<span class = "badge position-absolute rounded-circle font-weight-bold bg-red text-white">New</span>`;
    else if (product.discount != null)
        return `<span class = "badge position-absolute rounded-circle font-weight-bold bg-red text-white">-${product.discount}%</span>`;
    else 
        return "";
}

function displayProductCategory(productModels) {
    let categories = getLocalStorage("categories");
    let models = getLocalStorage("models");
    let result = [];

    for (let productModel of productModels) {
        let objModel = models.filter(el => el.id == productModel);
        let objCategory = null;
        if (objModel != null)
            objCategory = categories.filter(el => el.id == objModel[0].category);
        if (objCategory != null) {
            if (!result.includes(objCategory[0].name))
            result.push(objCategory[0].name);
        }
    }

    return result.join(" / ");
}

function displayProductPrice(product) {
    let html = "";
    if (product.discount != null) {
        let newPrice = priceWithDiscount(product.discount, product.price);
        html += `<s class = "mr-4">${priceFormatting(product.price)}</s>
                 <p class = "mb-0"> ${priceFormatting(newPrice)}</p>`;
    }
    else html += `<p class = "mb-0">${priceFormatting(product.price)}</p>`;
    return html;
}

function priceFormatting(price) {
    let formattedPrice = parseInt(price / 1000) + ".";
    if (price % 1000 == 0)
        formattedPrice += "00";
    else if (price % 1000 < 100 && price % 1000 > 0)
        formattedPrice += "0";
    return formattedPrice + price % 1000 + " RSD";
}

function priceWithDiscount(discount, price) {
    return price * (1.00 - discount / 100.0);
}

// Product Filtering

function filterChange() {
    fetchData("products.json", function(result) {
        displayProducts($("#products"), result);
    });
}

function applyProductFilters() {
    $("#price-range").change(filterChange);
    
    $("#search-product").click(function(e) {
        e.preventDefault();
        filterChange();
    });

    $("#sort-products").change(filterChange);
}

function filterProductsByPrice(data) {
    let priceRange = $("#price-range");
    let value = parseInt(priceRange.val());
    let min = findProductPrice("min");
    $("#lowest-price").text(priceFormatting(min));
    $("#current-price").text(priceFormatting(value));
    
    return data.filter(el => currentProductPrice(el) >= min && currentProductPrice(el) <= value);
}

function filterProductsByCheckbox(inputClass, data) {
    let result = [];
    $(`.${inputClass}:checked`).each(function(el) {
        result.push(parseInt($(this).val()));
    });
    if (result.length > 0)  {
        if (inputClass == "theme")
            return data.filter(product => product.themes != null && product.themes.some(theme => result.includes(theme)));
        else if (inputClass == "designer")
            return data.filter(product => result.includes(product.designer));
        else if (inputClass == "model")
            return data.filter(product => product.models.some(model => result.includes(model)));
        else return data;
    }
    else return data;
}

function filterProductsByColor(data) {
    let result = [];
    $(".color").each(function(el) {
        if ($(this).data("active") == "true")
        result.push(parseInt($(this).data("id")));
    })
    if (result.length > 0)
        return data.filter(product => product.colors.some(color => result.includes(color)));
    else    
        return data;
}

function searchProductByName(data) {
    let value = $("#search-product-by-name").val().toLowerCase();
    if (value != "")
        return data.filter(el => el.name.toLowerCase().includes(value));
    else return data;
}

function sortProducts(data) { 
    let value = $("#sort-products").val();
    switch(value) {
        case "Recommended": return sortProductsByRecommended(data);
        case "Price from lowest to highest": return sortProductByParemeter("price", "ascending", data);
        case "Price from highest to lowest": return sortProductByParemeter("price", "descending", data);
        case "Product name (A - Z)": return sortProductByParemeter("name", "ascending", data);
        case "Product name (Z - A)": return sortProductByParemeter("name", "descending", data);
        default: return data; 
    }
}

function sortProductsByRecommended(data) {
    let result = [];
    let productsOnSale = [];
    for (let product of data) {
        if (product.newest)
            result.push(product);
    } 

    for (let product of data) {
        if (product.discount != null)
        productsOnSale.push(product);
    } 
    let sortedProducts = sortProductByParemeter("discount", "descending", productsOnSale);
    for (let product of sortedProducts) {
        result.push(product);
    }

    for (let product of data) {
        if (product.newest == false && product.discount == null)
            result.push(product);
    }

    return result;
}

function sortProductByParemeter(parameter, order, data) {
    return data.sort(function(a, b) {
        if (order == "ascending") { 
            if (a[parameter] < b[parameter]) 
                return -1;
            if (a[parameter] > b[parameter]) 
                return 1;
            return 0;
        }
        else {
            if (a[parameter] > b[parameter]) 
                return -1;
            if (a[parameter] < b[parameter]) 
                return 1;
            return 0;
        }
    });
}

// Single Product

function displaySingleProduct(id) {
    let products = getLocalStorage("products");
    let designers = getLocalStorage("designers");

    let product = products.filter(el => el.id == id);
    product = product[0];

    let designer = designers.filter(el => el.id == product.designer);
    designer = designer[0];

    let productCategory = displayProductCategory(product.models);

    $(".breadcrumb .active").text(productCategory.replace("/", "&"));

    $("#product-image").html(
        `<img src = "assets/img/product/${product.image}" alt = "${product.name} Phone Case" />
         ${displayProductBadge(product)}`
    );

    $("#product-name").text(product.name);
    $(".designer-name").text(designer.name); 
    $("#product-rating").html(displayProductRatingStars(product.rating));
    $("#number-reviews").text(displayNumberOfReviews(product.reviews));
    $("#product-price").html(displayProductPrice(product));
    $("#product-models").html(displayProductModels(product.models));
   
    $("#product-description").find("p").text(product.description); 
    $("#designer-description").find("p").text(designer.description); 

    $("#btn-add-to-shopping-cart").data("product", product.id);
    $("#btn-add-to-shopping-cart").click(function(e) {
        e.preventDefault();
        addProductToShoppingCart({
            "id": parseInt($(this).data("product")),
            "model": $("#product-models").val(),
            "quantity": parseInt($(`#single-product input[type = "number"]`).val()) 
        }); 
    });

    accordionCollapse($(".collapse"));

    displaySimilarProducts(id, designer.id);
}

function accordionCollapse(collapseElements = null) {
    $(".accordion-button").on("click", function() {
        let collapseElement = $(this).parents("article").find(".collapse");
        if ($(this).attr("aria-expanded") == "true") {
            $(this).attr("aria-expanded", "false");
            collapseElement.removeClass("show");
        }
        else {
            if (collapseElements != null) {
                for (let element of collapseElements) {
                    let button = $(`button[data-target = "#${element.id}"]`);
                    $(`#${element.id}`).removeClass("show");
                    button.attr("aria-expanded", "false");
                }
            }
            $(this).attr("aria-expanded", "true");
            collapseElement.addClass("show");
        }
    });
}

function displayNumberOfReviews(number) {
    if (number < 1000) 
        return "(" + number + " reviews)";
    else 
        return "(" + (priceFormatting(number)).replace(" RSD", "") + " reviews)";
}

function displayProductRatingStars(number) {
    let html = "";
    for (let i = 1; i <= number; i++)
        html += `<i class = "fa fa-star"></i>`;
    for (let i = 1; i <= 5 - number; i++)
        html += `<i class = "fa fa-star-o"></i>`;
    return html;
}

function displaySimilarProducts(productID, designerID) {
    let similarProducts = [];
    let products = getLocalStorage("products");

    for (let product of products) {
        if (product.id != productID && product.designer == designerID)
            similarProducts.push(product);
    }

    if (similarProducts.length != 0) 
        displayProducts($("#similar-products .slider-track"), similarProducts); 
    else 
        $("#similar-products").hide();
    
    // Navigacija
}

function displayProductModels(productModels) {
    let html = "";
    let models = getLocalStorage("models");
    for (let model of models) {
        if (productModels.includes(model.id))
            html += `<option value = "${model.name}">${model.name}</option>`;
    }
    return html;
}

// Shopping Cart

function displayShoppingCart() {
    let html = "";
    let shoppingCartItems = getLocalStorage("shoppingCart");
    let products = getLocalStorage("products");
    let element = $(".shopping-cart");

    if (shoppingCartItems.length == 0) 
        emptyShoppingCart();
    else {
        for (let shoppingCartItem of shoppingCartItems) {
            for (let product of products) {
                if (shoppingCartItem.id == product.id) {
                    let currentPrice = currentProductPrice(product);
                    let subtotal = subtotalPrice(shoppingCartItem.quantity, currentPrice);
                    html += `<!-- Shopping Cart Item -->
                             <article class = "shopping-cart-item mt-5 position-relative d-flex flex-row align-items-center">
                                 <a href = "#" class = "remove-shopping-cart-item position-absolute" data-product = "${shoppingCartItem.id}" data-model = "${shoppingCartItem.model}">
                                     <i class = "fa fa-trash-o"></i>
                                 </a>
                                 <div class = "position-relative w-50 position-relative">
                                     <img src = "assets/img/product/${product.image}" alt = "${product.name} Phone Case" />
                                     ${displayProductBadge(product)}
                                 </div>
                                 <div class = "w-50 pl-2">
                                     <h6 class = "mb-1 font-weight-bold">
                                         <a href = "single-product.html" data-product = "${shoppingCartItem.id}">${product.name}</a>
                                     </h6>
                                     <p class = "mb-1">${shoppingCartItem.model}</p>
                                     <div class = "mb-2 d-flex flex-row justify-content-between align-items-center">${displayProductPrice(product)}</div>
                                     <input type = "number" min = "1" data-product = "${shoppingCartItem.id}" data-model ="${shoppingCartItem.model}" value = "${shoppingCartItem.quantity}" class = "quantity mb-3 mt-2 form-control" />
                                     <div class = "d-flex flex-row justify-content-between">
                                         <span class = "font-weight-bold">Subtotal:</span>
                                         <span class = "subtotal-price">${priceFormatting(subtotal)}</span>
                                     </div>
                                 </div>
                             </article>`;
                }
            }
        }  

        element.find("main").html(html);
        totalShoppingCartPrice();

        if (url.includes("checkout.html")) 
            $("#order-items .shopping-cart-item").addClass("order-item");
        else 
            element.find(`a[href = "checkout.html"]`).show();
        
        $(".shopping-cart-item h6").click(function() {
            let id = parseInt($(this).find("a").data("product"));
            setLocalStorage("singleProduct", id);
        });
        
        $(".remove-shopping-cart-item").click(function(e) {
            e.preventDefault();
            let id = parseInt($(this).data("product")); 
            let model = $(this).data("model");
            removeProductFromShoppingCart(id, model);
        });

        $(".shopping-cart-item .quantity").change(function() {
            let id = parseInt($(this).data("product"));
            let model =  $(this).data("model") ;
            let quantity = $(this).val();
            changeShoppingCartItemQuantity(id, model, quantity);
            displayShoppingCart();
            let orderItem = $(this).parents(".order-item");
            if (orderItem.length == 1) 
                $("body > .shopping-cart").hide();
        });
    }

    element.show();
}

function emptyShoppingCart() {
    let element = $(".shopping-cart");
    element.find("main").html(`<p class = "mb-4 mt-5 ml-5">The shopping cart is currently empty.</p>`);
    element.find(".total-shopping-cart-price").html("0.00 RSD");
    element.find(`a[href = "checkout.html"]`).hide();

    if (url.includes("checkout.html"))
        window.location = "http://127.0.0.1:5500/shop.html";
}

function addProductToShoppingCart(product) {
    let shoppingCartItems = getLocalStorage("shoppingCart");
    let exists = false;  
 
    if (shoppingCartItems.length != 0) {
        for (let shoppingCartItem of shoppingCartItems) {
            if (shoppingCartItem.id == product.id && shoppingCartItem.model == product.model) {
                shoppingCartItem.quantity = product.quantity;
                exists = true;
            }
        }
        if (exists == false)
            shoppingCartItems.push(product);
    }
    else shoppingCartItems.push(product);
    setLocalStorage("shoppingCart", shoppingCartItems); 
    numberOfProductInShoppingCart();
    displayShoppingCart();
}

function removeProductFromShoppingCart(id, model) {
    let shoppingCartItems = getLocalStorage("shoppingCart");
    let result = [];
    for (let shoppingCartItem of shoppingCartItems) {
        if (shoppingCartItem.id == id && shoppingCartItem.model == model)
            continue;
        else result.push(shoppingCartItem);
    }
    setLocalStorage("shoppingCart", result); 
    displayShoppingCart();
    if (url.includes("checkout.html"))
        $("body > .shopping-cart").hide();
    numberOfProductInShoppingCart();
}

function changeShoppingCartItemQuantity(id, model, quantity) {
    let shoppingCartItems = getLocalStorage("shoppingCart");
    for (let shoppingCartItem of shoppingCartItems) { 
        if (shoppingCartItem.id == id && shoppingCartItem.model == model) {
            shoppingCartItem.quantity = parseInt(quantity); 
        }
    }
    setLocalStorage("shoppingCart", shoppingCartItems);
}

function subtotalPrice(quantity, price) {
    return quantity * price;
}

function currentProductPrice(product) {
    if (product.discount != null )
        return priceWithDiscount(product.discount, product.price);
    else return product.price;
}

function totalShoppingCartPrice() {
    let sum = 0;
    let shoppingCartItems = getLocalStorage("shoppingCart");
    let products = getLocalStorage("products");
    for (let shoppingCartItem of shoppingCartItems) {
        let product = products.filter(el => el.id == shoppingCartItem.id);
        sum += shoppingCartItem.quantity * currentProductPrice(product[0]);
    }
    $(".total-shopping-cart-price").text(priceFormatting(sum));
}

// Form Validation

let formFields = [ 
    {
        form: "order-form",
        fields: [
            "first-name", 
            "last-name", 
            "address", 
            "cities", 
            "zip-code", 
            "email", 
            "phone-number", 
            "card-number", 
            "expiration-date"
        ] 
    },
    {
        form: "contact-form",
        fields: [
            "first-name", 
            "last-name", 
            "email", 
            "phone-number", 
            "message"
        ] 
    }
];

function displayCities(data) {
    let html = `<option value = "0" >&ndash; &ndash;</option>` ;
    for (let city of data) {
        html += `<option value = "${city.name}">${city.name}</option>`;
    }
    $("#cities").html(html);
}

let msgSuccess = "Successfully completed.";
let msgRequired = "Required field."; 
let msgFailure = "Incorrect input.";

function validateInput(input) {
    let inputs = [
        {name: "first-name", regExp: /^A*$/},
        {name: "last-name", regExp: /^A*$/},
        {name: "address", regExp: /^A*$/},
        {name: "zip-code", regExp: /^A*$/},
        {name: "email", regExp: /^A*$/},
        {name: "phone-number", regExp: /^A*$/},
        {name: "card-number", regExp: /^A*$/},
        {name: "expiration-date", regExp: /^A*$/}
    ];

    let obj = inputs.filter(x => x.name == input.attr("name"));

    if (obj[0].regExp.test(input.val())) 
        validationMessage(input, true);
    else 
        validationMessage(input, false);
}

function validateTextarea(textarea) {
    if (textarea.val().length > 0) 
        validationMessage(textarea, true);
    else 
        validationMessage(textarea, false);
}

function validateForm(button) {
    let fields = formFields.filter(el => el.form == $("form").attr("name"));
    fields = fields[0].fields;
    
    for (let field of fields) {
        let element = $(`[name = ${field}]`);
        if (field == "message") 
            validateTextarea(element);
        else if (field == "cities")
            validateSelect(element);
        else 
            validateInput(element);
    }

    let result = [];

    $(".validation-info").each(function() {
        result.push($(this).data("validation"));
    });
 
    result = result.filter(el => el == "false");

    if (result.length == 0) {  
        let p = button.next();
        let checkbox = $(`input[name = "sing-up-for-newsletter"]`);
     
        if (checkbox.is(":checked")) { 
            if (url.includes("checkout.html"))   
                p.text("Your order was sent successfully. You have also successfully subscribed to the Panda newsletter.");
            if (url.includes("contact.html"))   
                p.text("Your message has been successfully sent. You have also successfully subscribed to the Panda Newsletter.");
        }
        else {  
            if (url.includes("checkout.html"))   
                p.text("Your order was sent successfully.");
            if (url.includes("contact.html"))
                p.text("Your message has been successfully sent.");
        }

        if (url.includes("checkout.html")) {
            setLocalStorage("shoppingCart", []);
            numberOfProductInShoppingCart();
        }
    }
}

function validationMessage(field, status) {
    let p = $(`p[data-field = "${field.attr("name")}"]`);
    let validationInfo = field.val().length == 0 ? msgRequired : msgFailure;

    if (status) {
        p.data("validation", "true").text(msgSuccess).css("color", "var(--green)");
        field.removeClass("border-danger").addClass("border-success");
    }
    else {
        p.data("validation", "false").text(validationInfo).css("color", "var(--red)");
        field.removeClass("border-success").addClass("border-danger");
    }
}

function validateSelect(select) {
    let value = select.val();
    if (value != "0") 
        validationMessage(select, true);
    else 
        validationMessage(select, false);
}
