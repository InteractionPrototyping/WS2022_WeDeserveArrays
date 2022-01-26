var $ = Dom7;

var device = Framework7.getDevice();
var app = new Framework7({
  name: "Code Menu App", // App name
  theme: "auto", // Automatic theme detection
  el: "#app", // App root element
  

  id: "io.framework7.myapp", // App bundle ID
  // App routes
  routes: routes,
  dialog: {
    buttonCancel: 'No'
  },

  // Input settings
  input: {
    scrollIntoViewOnFocus: device.cordova && !device.electron,
    scrollIntoViewCentered: device.cordova && !device.electron,
  },
  // Cordova Statusbar settings
  statusbar: {
    iosOverlaysWebView: true,
    androidOverlaysWebView: false,
  },
  on: {
    init: function () {
      var f7 = this;
      if (f7.device.cordova) {
        // Init cordova APIs (see cordova-app.js)
        cordovaApp.init(f7);
      }
    },
  },

  theme: "md",
});

//===========================================================================================================================================================================================================================
/* Your app custom javascript below */
//===========================================================================================================================================================================================================================
//========================================================QUALITATIVE EVALUATION STUFF=======================================================================================================================================

//record number of clicks for qualitative assessment
 let totalClicks = 0;

 $("body").click(function () {
   //record number of clicks
   totalClicks++;
   console.log(`Total number of clicks: `, totalClicks);
 });

//========================================================GLOBAL STUFF=======================================================================================================================================
let selectedDish;
let previousPage;
let previousPageSettings;

function displayTab(tabID) {
  //store value of previous page accessed
  console.log("displayTab():");
  switch (tabID) {
    case "#view-favourites":
      previousPage = app.tab.show("#view-favourites").oldTabEl.id;
      break;
    case "#view-order-history":
      previousPage = app.tab.show("#view-order-history").oldTabEl.id;
      break;
    case "#view-allergy":
      previousPage = app.tab.show("#view-allergy").oldTabEl.id;
      break;
    case "#view-settings":
      previousPageSettings = app.tab.show("#view-settings").oldTabEl.id;
      break;
    case "#view-entertainment":
      previousPage = app.tab.show("#view-entertainment").oldTabEl.id;
      break;
    default:
      return;
  }
  console.log("previousPage = ", previousPage);
}

function goBack(from) {
  //go to previous page accessed when back button is pressed
  console.log("goBack():");
  console.log("previousPage = ", previousPage);
  let temp;

  //special case
  if (from == "settings") {
    temp = previousPageSettings;
  } else {
    temp = previousPage;
  }

  switch (temp) {
    case "view-homescreen":
      app.tab.show("#view-homescreen");
      break;
    case "view-dishoverview":
      app.tab.show("#view-dishoverview");
      break;
    case "view-order":
      app.tab.show("#view-order");
      break;
    case "view-settings":
      app.tab.show("#view-settings");
      break;
    default:
      return;
  }
}

// userOnboarding();
function init() {
  //initialize app
  showAllergies();
  showDiets();
  displayOrders();

  // swipeout preview when app used for the first time
  document.getElementById("order-toolbar").addEventListener(
    "click",
    () => {
      initSwipeout();
    },
    { once: true }
  );

  // Event listener: Call favouriteDish() if user clicks on favourite button
  document
    .querySelector(".favourite-button")
    .addEventListener("click", favouriteDish);

  //default
  selectedDish = dishes[0];
  firstTime = true;

  //QR scanner stuffs
  document.querySelector(".qr-code").addEventListener("click", function () {
    //qr code scanner definitions
    cordova.plugins.barcodeScanner.scan(
      function (result) {
        let tableNo;
        tableNo = result.text;
        app.dialog.alert(
          "You are checked in at " + tableNo,
          "Successfully checked in"
        );
      },
      function (error) {
        alert("Scanning failed: " + error);
      },
      {
        preferFrontCamera: false, // iOS and Android
        showFlipCameraButton: true, // iOS and Android
        showTorchButton: true, // iOS and Android
        torchOn: false, // Android, launch with the torch switched on (if available)
        saveHistory: true, // Android, save scan history (default false)
        prompt: "Place a barcode inside the scan area", // Android
        resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
        formats: "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
        orientation: "portrait", // Android only (portrait|landscape), default unset so it rotates with the device
        disableAnimations: true, // iOS
        disableSuccessBeep: false, // iOS and Android
      }
    );

    //shake stuffs
    shake.startWatch(onShake, 40);

    // Stop watching for shake gestures
    // shake.stopWatch();
  });
}

var onShake = function () {
  // Fired when a shake is detected -- add call a waiter code
  changeButtonState(".call-a-waiter");
};

function displayToolbar(a) {
  //show/hide bottom toolbar
  if (a == 1) {
    //show bottom toolbar
    document.getElementById("common-toolbar").style.display = "block";
  } else if (a == 0) {
    //hide bottom toolbar
    document.getElementById("common-toolbar").style.display = "none";
  }
}

let filter = true;


//========================================================DISH-MENU STUFF=======================================================================================================================================

let currentTab;
let currentLink;
let firstTime;
let filterIconString;

function isFirstTime() {
  //For Filter Icon string to work
  if (firstTime) {
    filterIconString = "Show all dishes";
    firstTime = false;
  } else {
    filterIconString = document.getElementById("filter-button").innerHTML;
  }
  return firstTime;
}

function displayMenuTabs() {
  //show tab menu in dish overview
  document.getElementById("menu-chips").innerHTML = ` `;
  menuTabs.forEach((menuTabs) => {
    document.getElementById(
      "menu-chips"
    ).innerHTML += `<a href="#${menuTabs.link}" id="${menuTabs.name}" class="chip tab-link tab-link-active chip-margin" name="menu-chips" onclick="showDishes('${menuTabs.name}','${menuTabs.link}'); activateChips('${menuTabs.name}');">
         <div class="chip-label">${menuTabs.name}</div>
      </a>`;
  });
  //default: show antipasti tab at beginning
  showDishes("Antipasti", "antipasti");
  activateChips("Antipasti");
}

function activateChips(selectedChip) {
  //show active chip in dishmenu by highlighting it
  var allChips = document.getElementsByName("menu-chips");
  for (var i = 0; i < allChips.length; i++) {

    allChips[i].classList.remove("chips-activated");
  }
  document.getElementById(selectedChip).classList.add("chips-activated");
}

function showDishesFilter() {
  //show relevant dishes based on filter
  showDishes(currentTab, currentLink);
}

function showDishes(tabName, tabLink) {
  //load and show all dishes in dishmenu according to (selected/higlighted/active) tab
  currentTab = tabName;
  currentLink = tabLink;

  isFirstTime();
  //loads id's of different tabs
  dishes.forEach((dishes) => {
    if (dishes.tab === tabName) {
      document.getElementById(
        "tab-dishes"
      ).innerHTML = `<div id="${tabLink}" class="page-content tab">
      <div class="button-filter-container">
      <div class="chip overview-navbar">
          <div class="chip-media"><i class="material-icons md-10 icon-explanation">grass</i></div>
          <div class="chip-label">Vegan</div>
        </div>
        <div class="chip overview-navbar">
          <div class="chip-media"><i class="material-icons md-10 allergen icon-explanation">priority_high</i></div>
          <div class="chip-label">Contains allergens</div>
        </div>
    <span id="filter-button" class="button button-raised button-fill text-color-black">
    ${filterIconString}
    </span>
    </div>
      <div id="innertab" class="block full-width" style="margin: 0;"></div></div>`;
      document.getElementById(tabLink).style.display = "block";
    }
  });

  if (filter) {
    //update contents of each tab to the according dishes, depending on if the filter is on or off
    dishes.forEach((dishes) => {
      //filter on, only compatible food is displayed
      if (
        dishes.tab === tabName &&
        dishes.ingredients.filter((element) => allergyArray.includes(element))
          .length == 0 &&
        compatibleDiet(dishes)
      ) {
        printDishCard(dishes, 0);
      }
    });
    //show this when no dishes of the current tab are suitable for the selected diet/allergies
    if (document.getElementById("innertab").innerHTML == "") {
      document.getElementById(
        "innertab"
      ).innerHTML = `<img src="assets/nofood.png" id="empty-dish-img" alt="no dishes for this category"></img>`;
    }
  }

  //filter off, non-allergic food gets marked
  else {
    dishes.forEach((dishes) => {
      if (dishes.tab === tabName) {
        printDishCard(dishes, 1);
      }
    });
  }
  document
    .getElementById("filter-button")
    .setAttribute(
      "onclick",
      "toggleFilter();showDishesFilter();showFilterPopup();"
    );
  allergyBadgeOverview();
  veganBanner();
}

function printDishCard(dishes, warning) {
  //load and show respective dishcards as read from dishes.js
  //Allergy warning badge
  allergyWarner =
    dishes.ingredients.filter((element) => allergyArray.includes(element))
      .length != 0
      ? " allergy-warning"
      : "";
  //Vegan warning badge
  veganBan = dishes.dietCompatible[2] ? " vegan-banner" : "";

  if (warning == 0) {
    bannerString = `${veganBan}`;
  } else if (warning == 1) {
    //Add allergy-warning class to indicate that allergy warning badge should be appended here
    bannerString = `${allergyWarner} ${veganBan}`;
  }
  document.getElementById(
    "innertab"
  ).innerHTML += `<div class="card demo-card-header-pic">            

      <div id="${dishes.id}" href="#view-detailed-view" onclick="switchDish(${
    dishes.id
  });loadDetailedView('dishoverview')" style="background-image: url(${
    dishes.imgSrc
  });" class="card-header tab-link full-width align-items-flex-end ${bannerString}"> 
      </div>        
      <div class="card-content card-content-padding">
        <p>${dishes.name}<span class="material-icons add_btns link icon-only d${
    dishes.id
  }" style="float: right;" onclick="addDish(dishes[${
    dishes.id - 1
  }],'dishoverview');">add_box</span></p>
        <p class="date">${dishes.price.toFixed(2)} €</p>                
      </div>    
    </div>
   `;
}

function toggleFilter() {
  //toggle Filter for dishes
  filter = filter ? false : true;
  document.getElementById("filter-button").innerHTML = filter
    ? "Show all dishes"
    : "Filter dishes";
}

//filter explanation alert that appears the first time you click on "menu", if you have filters activated
document.getElementById("dishesmenu").addEventListener(
  "click",
  function (event) {
    if (allergyArray.length != 0) {
      app.dialog.alert(
        "Only dishes that comply with you dietary needs are shown. To turn this off press the filter icon at the top of the screen"
      );
    }
  },
  { once: true }
);

function showFilterPopup() {
  if (allergyArray.length == 0) {
    app.dialog.alert(
      "You did not select any special dietary needs. All dishes are shown to you. To change your needs, navigate to the settings"
    );
  }
}

//========================================================DIET & ALLERGY STUFF=======================================================================================================================================

function showAllergies() {
  //load allergy items into app
  document.getElementById("allergy-cards").innerHTML = ` `;
  document.getElementById("allergy-cards-settings").innerHTML = ` `;

  allergies.forEach((allergies) => {
    document.getElementById(
      "allergy-cards"
    ).innerHTML += `<div class="allergy-align">
    <img class="allergy-image" src="${allergies.src}" alt="image" width="103" id="${allergies.name}" onclick="switchAllergy('${allergies.name}','${allergies.name}settings','${allergies.src}')" />
    <p class="diet-description">${allergies.name}</p>
    </div>`;
  });
  allergies.forEach((allergies) => {
    document.getElementById(
      "allergy-cards-settings"
    ).innerHTML += `<div class="allergy-align">
    <img class="allergy-image" src="${allergies.src}" alt="image" width="103" id="${allergies.name}settings" onclick="switchAllergy('${allergies.name}','${allergies.name}settings','${allergies.src}')" />
    <p class="diet-description">${allergies.name}</p>
    </div>`;
  });
}

function showDiets() {
  //load diet cards into app
  document.getElementById("diet-cards").innerHTML = ``;
  document.getElementById("diet-cards-settings").innerHTML = ``;
  diet.forEach((diet) => {
    document.getElementById("diet-cards").innerHTML += `<div class="diet-align">
    <img class="diet-image" src="${diet.src}" alt="image" width="103" id="${diet.name}" onclick="switchDiet('${diet.name}','${diet.name}settings','${diet.src}' )" />
          <p class="diet-description">${diet.name}</p>
      </div>`;
  });
  diet.forEach((diet) => {
    document.getElementById(
      "diet-cards-settings"
    ).innerHTML += `<div class="diet-align">
    <img class="diet-image" src="${diet.src}" alt="image" width="103" id="${diet.name}settings" onclick="switchDiet('${diet.name}','${diet.name}settings', '${diet.src}' )" />
          <p class="diet-description">${diet.name}</p>
      </div>`;
  });
}

//allergyArray is for comparing the selected allergies with the allergies the dishes are compatible with
var allergyArray = [];
//dietArray is for comparing the selected diets with the diets the dishes are compatible with
var dietArray = [false, false, false, false, false, false, false];

function switchAllergy(allergy, allergysettings, imageSrc) {
  //switch Allergy status and picture in onboarding and settings
  var img = document.getElementById(allergy).src;
  var imgSettings = document.getElementById(allergysettings).src;
  //switch for onboarding
  if (img.indexOf("assets/deselected") != -1) {
    document.getElementById(allergy).src = `${imageSrc}`;
    allergyArray.forEach((element) => {
      if (element == allergy) {
        allergyArray = allergyArray.filter((element) => element !== allergy);
      }
    });
  } else {
    document.getElementById(allergy).src = "assets/deselected.png";
    allergyArray.push(allergy);
  }
  //switch for settings
  if (imgSettings.indexOf("assets/deselected") != -1) {
    document.getElementById(allergysettings).src = `${imageSrc}`;
    allergyArray.forEach((element) => {
      if (element == allergy) {
        allergyArray = allergyArray.filter((element) => element !== allergy);
      }
    });
  } else {
    document.getElementById(allergysettings).src = "assets/deselected.png";
    allergyArray.push(allergy);
  }
}

function switchDiet(dietN, dietNsettings, imageSrc) {
  //switch Diet status and picture in onboarding and settings
  //track Selected Diets in dietArray
  var dietIndex = diet.findIndex((item) => item.name == dietN);
  dietArray[dietIndex] = !dietArray[dietIndex];

  var imgDiet = document.getElementById(dietN).src;
  var imgDietSettings = document.getElementById(dietNsettings).src;

  //switch for onboarding
  if (imgDiet.indexOf("assets/Selected") != -1) {
    document.getElementById(dietN).src = `${imageSrc}`;
  } else {
    document.getElementById(dietN).src = "assets/Selected.png";
  }
  //switch for settings
  if (imgDietSettings.indexOf("assets/Selected") != -1) {
    document.getElementById(dietNsettings).src = `${imageSrc}`;
  } else {
    document.getElementById(dietNsettings).src = "assets/Selected.png";
  }
}

function compatibleDiet(ingredientDiet) {
  //compare Diet Status to Food Rating
  noDietCollision = true;

  for (let i = 0; i < dietArray.length; i++) {
    if (noDietCollision && dietArray[i] && !ingredientDiet.dietCompatible[i]) {
      noDietCollision = false;
      break;
    }
  }

  return noDietCollision;
}

function allergyBadgeOverview() {
  //Add Allergy Warning to each dish overview with detected allergies
  var cardImage = document.getElementsByClassName("allergy-warning");
  for (var i = 0; i < cardImage.length; i++) {
    cardImage[i].innerHTML += `<i class="material-icons allergy-badge-overview">
      priority_high
      </i>`;
  }

  app.tooltip.create({
    targetEl: ".allergy-badge-overview",
    text: "This dish contains <br>one of your allergies",
  });
}

function veganBanner() {
  //Vegan Banner
  var cardImage = document.getElementsByClassName("vegan-banner");
  for (var i = 0; i < cardImage.length; i++) {
    cardImage[
      i
    ].innerHTML += `<i class="material-icons vegan-badge-overview">grass</i>`;
  }

  app.tooltip.create({
    targetEl: ".vegan-badge-overview",
    text: "This dish is vegan",
  });
}

//========================================================ORDERING STUFF=======================================================================================================================================

function displayOrders() {
  //load and display order contents into order-list on order tab (as read from "dishesInOrder" localStorage)
  let orderList = document.getElementById("order-list");
  let orderButton = document.getElementById("order-button");
  let orderEmpty = document.getElementById("empty-order-img");
  let orderItems = localStorage.getItem("dishesInOrder");
  let pastOrdersItems = localStorage.getItem("pastOrders");
  let totalPrice = document.getElementById("total-section");

  orderItems = JSON.parse(orderItems);
  pastOrdersItems = JSON.parse(pastOrdersItems);

  //clear order button setAttributes (to prevent bugs)
  orderButton.removeAttribute(
    "onclick",
    "displayPayment('order');displayOverview();displayToolbar(0);emergencyExit(false);displayBackPayment(1)"
  );
  orderButton.removeAttribute(
    "onclick",
    "displayPayment('pastOrders');displayToolbar(0);displayBackPayment(0);"
  );

  //if there are active order items in current order
  if (updateOrderCount() > 0 && orderItems != null) {
    orderEmpty.style.display = "none";
    orderList.style.display = "block";
    totalPrice.style.display = "block";
    //putting relevant stuff on orderList
    orderList.innerHTML = "";
    Object.values(orderItems).map((item) => {
      orderList.innerHTML +=
        '<li class="swipeout swiper"><div class="item-content swipeout-content"><div class="item-media serving-counter"><!-- serving - counter --><i class="icon f7-icons if-not-md"><span class="badge color-blue serving-count1">' +
        item.inOrder +
        '</span></i><i class="icon material-icons md-only"><span class="badge color-blue serving-count1">' +
        item.inOrder +
        '</span></i></div><div class="item-inner"><div class="item-title-row"><div class="item-title">' +
        item.name +
        '</div><div class="item-after order-price">' +
        (item.inOrder * item.price + addOnsPrice(item)).toFixed(2) +
        '€</div></div><div class="item-subtitle">' +
        item.tab +
        '</div></div><div class="swipeout-actions-right"><a href="#view-detailed-view" onclick="switchDish(' +
        item.id +
        ");showLoading(0.8);loadDetailedView(" +
        "'orderscreen'" +
        ");app.tab.show(" +
        "'#view-detailed-view'" +
        ');" id="' +
        item.id +
        '" @click=${more}">Edit</a><a href="#" class="swipeout-delete" onclick="deleteDish(dishes[' +
        (item.id - 1) +
        ']);displayOrders();">Delete</a></div></div></li><li>';
    });

    orderList.innerHTML += `<li>
    <div class="item-content">
      <div class="item-inner">
        <div class="item-title-row">
          <div class="item-title" id="sub-total">Subtotal</div>
          <div class="item-after" id="sub-price">${updateOrderTotal().toFixed(
            2
          )} €</div>
        </div>
      </div>
    </div>
  </li>
  `;
    totalPrice.innerHTML = `<li>
    <div class="item-content">
      <div class="item-inner">
        <div class="item-title-row">
          <div class="item-title" id="total" style = "font-weight: bold;">Total</div>
          <div class="item-after" id="price">${(
            updateOrderTotal() + updatePastOrderTotal()
          ).toFixed(2)} €</div>
        </div>
        <div class="item-subtitle">Subtotal + Already Ordered</div>
      </div>
    </div>
  </li>`;

    //modify order-button accordingly
    orderButton.classList.add("tab-link");
    orderButton.classList.remove("disabled");
    orderButton.setAttribute(
      "onclick",
      "app.tab.show('#view-order-succession');displayPayment('order');displayOverview();displayToolbar(0);emergencyExit(false);displayBackPayment(1)"
    );
    orderButton.innerHTML = `Place Order • ${updateOrderTotal().toFixed(2)} €`;
    orderButton.setAttribute(
      "style",
      "background-color: var(--f7-theme-color);"
    );
    //if there is no active order but past-order exists
  } else if (updateOrderCount() == 0 && pastOrdersItems != null) {
    totalPrice.innerHTML = `<li>
    <div class="item-content">
      <div class="item-inner">
        <div class="item-title-row">
          <div class="item-title" id="total" style = "font-weight: bold;">Total</div>
          <div class="item-after" id="price">${(
            updateOrderTotal() + updatePastOrderTotal()
          ).toFixed(2)} €</div>
        </div>
        <div class="item-subtitle">Subtotal + Already Ordered</div>
      </div>
    </div>
  </li>`;

    orderList.innerHTML = ``;
    orderList.style.display = "none";
    orderEmpty.style.display = "none";
    totalPrice.style.display = "block";
    //modify order-button accordingly
    orderButton.classList.add("tab-link");
    orderButton.classList.remove("disabled");
    orderButton.setAttribute(
      "onclick",
      "app.tab.show('#view-payment');displayPayment('pastOrders');displayToolbar(0);displayBackPayment(0);"
    );
    orderButton.innerHTML = "Pay";
  } else {
    orderList.innerHTML = ``;
    orderList.style.display = "none";
    orderEmpty.style.display = "block";
    totalPrice.style.display = "none";
    //modify order-button accordingly
    orderButton.classList.remove("tab-link");
    orderButton.classList.add("disabled");
    orderButton.innerHTML = "Place Order";
    orderButton.setAttribute(
      "style",
      "background-color: var(--f7-theme-color); opacity: 0.45"
    );
  }

  updateOrderCount();
  loadTo("pastOrders");
}
/*

*/
function displayBackPayment(from) {
  displayOrders();
  document.querySelector(".back-payment").href = "#view-order-succession";
  document
    .querySelector(".back-payment")
    .removeAttribute("onclick", "displayToolbar(1)");
  if (from == 0) {
    document.querySelector(".back-payment").href = "#view-order";
    document
      .querySelector(".back-payment")
      .setAttribute("onclick", "displayToolbar(1)");
  }
}

function displayOverview(from) {
  //ORDER OVERVIEW: load display overview (order confirmation page) contents
  let overviewPage = document.getElementById("overview");
  let orderItems = localStorage.getItem("dishesInOrder");

  orderItems = JSON.parse(orderItems);

  if (from == "payment") {
    return;
  } else {
    document.querySelector(".x-close").style.display = "block";
    document.querySelector(".x-load").style.display = "block";
    document.getElementById("x-countdown").style.display = "block";
    document.getElementById("x-countdown").innerHTML = 10;
    document.getElementById("x-countdown").style.right = "20px";
    document.querySelector("#order-placed-img").src = "assets/OrderPlaced.png";
  }

  overviewPage.innerHTML = ``;
  overviewPage.innerHTML += `<p class="row pay-buttons"><button href="#view-payment" class="col button button-large button-fill button-raised tab-link text-color-black" id="pay-button" onclick="showLoading(0.6);displayPayment('order');displayToolbar(0);displayBackPayment(1)">Pay Now</button>
    <button href="view-order" class="col button button-large button-fill button-raised tab-link text-color-black" id="paylater-button" onclick="showLoading(0.6);setItems('doesntMatter', 'overviewScreen'); deleteDish('All');loadTo('pastOrders');displayOrders(); app.tab.show('#view-homescreen');displayToolbar(1)" >Pay Later</button></p>`;
}

let cancelled;

function emergencyExit(booL) {
  //this function allows us to set a variable (cancelled)
  // which allows us to exit the countdown()  (or not) when called
  switch (booL) {
    case true:
      cancelled = booL; //stop
      break;
    case false:
      cancelled = booL; //unlock-key
      break;
    default:
      return;
  }
  countdown(9);
}
function countdown(x) {
  //give user 10 seconds after order has been placed to go back to the order screen
  if (cancelled) {
    return;
  }
  setTimeout(() => {
    if (!(x >= 0)) {
      document.getElementById("x-countdown").style.display = "none";
      abortOrder();
      document.getElementById("x-countdown").innerHTML = 10;
      return;
    }
    // do stuff
    else {
      if (x == 0) {
        document.querySelector(".x-close").style.display = "none";
      }
      countdown(x - 1); //recursive call
      document.getElementById("x-countdown").innerHTML = x;
      document.getElementById("x-countdown").style.right = "24px";
    }
  }, 1000);
}

function abortOrder() {
  //hide preloader
  //and change image to order confirmed
  document.querySelector(".x-load").style.display = "none";
  document.querySelector("#order-placed-img").src = "assets/OrderPlaced2.png";
  document.getElementById(
    "prep"
  ).innerHTML = `<div class="block block-strong inset text-align-center bananaaa">
  <p>Your dishes are being prepared</p>
  <img src="assets/bananaaa.gif" alt="loading animation" width="30%"> 
</div>`;
}

function setItems(dish, from) {
  //set/add dishes to local storage
  let orderItems = localStorage.getItem("dishesInOrder");
  let orderHistoryItems = localStorage.getItem("orderHistory");
  let pastOrdersItems = localStorage.getItem("pastOrders");

  orderItems = JSON.parse(orderItems);
  orderHistoryItems = JSON.parse(orderHistoryItems);
  pastOrdersItems = JSON.parse(pastOrdersItems);

  stpValueInt = app.stepper.getValue("#steppy");

  //if the dish is added with the plus-button from dishesmenu - add to localStorage "dishesInOrder"
  if (from == "dishoverview") {
    if (orderItems != null) {
      if (orderItems[dish.id] == undefined) {
        orderItems = { ...orderItems, [dish.id]: dish };
      }
      orderItems[dish.id].inOrder += 1;
    } else {
      dish.inOrder = 1;
      orderItems = {
        [dish.id]: dish,
      };
    }

    localStorage.setItem("dishesInOrder", JSON.stringify(orderItems));
    //if the dish is added with the "add-to-order" from detailedView - add to localStorage "dishesInOrder"
  } else if (from == "detailedView") {
    if (orderItems != null) {
      if (orderItems[dish.id] == undefined) {
        // //first time: therefore make sure .inOrder still zero
        dish.inOrder = 0;
        orderItems = { ...orderItems, [dish.id]: dish };
      }
      orderItems[dish.id].inOrder += stpValueInt;
    } else {
      dish.inOrder = 1;
      orderItems = {
        [dish.id]: dish,
      };
      orderItems[dish.id].inOrder += stpValueInt - 1;
    }

    localStorage.setItem("dishesInOrder", JSON.stringify(orderItems));
    //if the dish which is already in the orderList
    //is edited/updated with the "update order" from detailedView - add to localStorage "dishesInOrder"
  } else if (from == "orderscreen") {
    if (orderItems != null) {
      orderItems[dish.id].inOrder = stpValueInt;
    }
    localStorage.setItem("dishesInOrder", JSON.stringify(orderItems));
    //if the order is confirmed in payment screen - add to localStorage "orderHistory"
  } else if (from == "paymentScreen") {
    if (orderHistoryItems != undefined) {
      if (pastOrdersItems != undefined) {
        orderHistoryItems = {
          ...orderHistoryItems,
          [Object.keys(orderHistoryItems).length + 1]:
            orderItems + pastOrdersItems,
          [Object.keys(orderHistoryItems).length + 2]:
            updateOrderTotal() + updatePastOrderTotal(),
        };
      } else {
        orderHistoryItems = {
          ...orderHistoryItems,
          [Object.keys(orderHistoryItems).length + 1]: orderItems,
          [Object.keys(orderHistoryItems).length + 2]: updateOrderTotal(),
        };
      }
    } else {
      if (pastOrdersItems != undefined) {
        orderHistoryItems = {
          [1]: orderItems + pastOrdersItems,
          [2]: updateOrderTotal() + updatePastOrderTotal(),
        };
      } else {
        orderHistoryItems = {
          [1]: orderItems,
          [2]: updateOrderTotal(),
        };
      }
    }

    localStorage.setItem("orderHistory", JSON.stringify(orderHistoryItems));
    //add pastOrder (already-ordered but not paid for items)
    //localStorage "orderHistory" upon confirmation in payment screen
  } else if (from == "pastOrders") {
    if (pastOrdersItems == null) {
      return;
    }
    if (orderHistoryItems != undefined) {
      orderHistoryItems = {
        ...orderHistoryItems,
        [Object.keys(orderHistoryItems).length + 1]: pastOrdersItems,
        [Object.keys(orderHistoryItems).length + 2]: updatePastOrderTotal(),
      };
    } else {
      orderHistoryItems = {
        [1]: pastOrdersItems,
        [2]: updatePastOrderTotal(),
      };
    }

    localStorage.setItem("orderHistory", JSON.stringify(orderHistoryItems));
    //add your active order to localStorage "pastOrders" when "pay later button is pressed"
  } else if (from == "overviewScreen") {
    if (pastOrdersItems != undefined) {
      pastOrdersItems = {
        ...pastOrdersItems,
        [Object.keys(pastOrdersItems).length + 1]: orderItems,
      };
    } else {
      pastOrdersItems = {
        [1]: orderItems,
      };
    }

    localStorage.setItem("pastOrders", JSON.stringify(pastOrdersItems));
  }
  updateOrderCount();
}

function updateOrderCount() {
  //update the counter in the bottom toolbar - based on how many items are in the active order
  let orderItems = localStorage.getItem("dishesInOrder");
  let orderNumber = 0;

  orderItems = JSON.parse(orderItems);

  if (orderItems != null) {
    Object.values(orderItems).map((item) => {
      orderNumber += item.inOrder;
    });
  }

  document.getElementById("count1").innerHTML = orderNumber;
  document.getElementById("count2").innerHTML = orderNumber;
  return orderNumber;
}

function updateOrderTotal() {
  //update the orderTotal in the orderList - based on the cost of the items in the active order
  let orderItems = localStorage.getItem("dishesInOrder");
  let subTotal = 0;

  orderItems = JSON.parse(orderItems);

  if (orderItems != null) {
    Object.values(orderItems).map((item) => {
      subTotal += item.inOrder * item.price + addOnsPrice(item);
    });
  }
  return subTotal;
}

function updatePastOrderTotal() {
  //update the orderTotal in the "Already Order" items list - based on the cost of the items in the pastOrder list
  let pastOrdersItems = localStorage.getItem("pastOrders");
  let totalPastOrders = 0;

  pastOrdersItems = JSON.parse(pastOrdersItems);

  if (pastOrdersItems != null) {
    Object.entries(pastOrdersItems).forEach(([key, value]) => {
      Object.entries(value).forEach(([key, item]) => {
        totalPastOrders += item.inOrder * item.price + addOnsPrice(item);
      });
    });
  }
  return totalPastOrders;
}

function deleteDish(dish) {
  //delete dish from order: wrapper
  let orderItems = localStorage.getItem("dishesInOrder");
  orderItems = JSON.parse(orderItems);

  if (dish == "All") {
    //hard reset everything to be safe
    dishes.forEach((dish) => {
      dish.inOrder = 0;
    });
    //delete localStorage "dishesInOrder"
    window.localStorage.removeItem("dishesInOrder");
  } else if (dish == "pastOrders") {
    //hard reset everything to be safe
    dishes.forEach((dish) => {
      dish.inOrder = 0;
    });
    //delete localStorage "pastOrders"
    window.localStorage.removeItem("pastOrders");
  } else {
    //delete item/dish from active order
    if (updateOrderTotal() > 0) {
      //delete specific dish from local storage
      dish.inOrder = 0;
      delete orderItems[dish.id];
      orderItems = { ...orderItems };
      localStorage.setItem("dishesInOrder", JSON.stringify(orderItems));
    } else {
      window.localStorage.removeItem("dishesInOrder");
    }
  }
  displayOrders();
}

function addDish(dish, from) {
  //add dish to order: wrapper
  if (from == "dishoverview") {
    //from dishoverview
    //show preloader for 0.37 seconds
    showLoading(0.37);
    //add dish
    setItems(dish, "dishoverview");
  } else if (from == "detailedView") {
    //from detailedview - accessed through dishmenu/dishoverview
    //show preloader for 0.6 seconds
    showLoading(0.6);
    //add dish
    setItems(dish, "detailedView");
  } else if (from == "orderscreen") {
    //from detailedview - accessed through orderscreen
    //show preloader for 0.6 seconds
    showLoading(0.6);
    setItems(dish, "orderscreen");
  }
  displayOrders();
}

function loadTo(to) {
  //load and show orders to: pastOrders/orderHistory
  let orderHistoryList = document.getElementById("orderHistory-list");
  let pastOrdersList = document.getElementById("pastOrders-list");
  let pastOrdersPage = document.getElementById("pastOrders-page");
  let orderHistoryEmpty = document.getElementById("order-history-img");
  let orderItems = localStorage.getItem("dishesInOrder");
  let orderHistoryItems = localStorage.getItem("orderHistory");
  let pastOrdersItems = localStorage.getItem("pastOrders");
  let alreadyOrdered = document.getElementById("ordered-already");

  orderItems = JSON.parse(orderItems);
  orderHistoryItems = JSON.parse(orderHistoryItems);
  pastOrdersItems = JSON.parse(pastOrdersItems);

  if (to == "orderHistory") {
    //orderHistory page
    if (orderHistoryItems != null) {
      orderHistoryList.style.display = "block";
      orderHistoryEmpty.style.display = "none";

      orderHistoryList.innerHTML = "";

      Object.entries(orderHistoryItems).forEach(([key, value]) => {
        //print string on all even numbers
        if (key % 2 == 0) {
          orderHistoryList.innerHTML += `<li>
        <div class="item-content">
          <div class="item-media detailed">
            <img
              id="restaurant-img"
              src="assets/italian-restaurant-logo.jpg"
              width="61"
            />
          </div>
          <div class="item-inner">
            <div class="item-title-row">
              <div class="item-title">Meritiamo un aumento</div>
              <a
                href="#"
                class="
                  col
                  button button-small button-round button-outline
                  order-again
                "
                onclick="showLoading(0.6);"
                >ReOrder</a
              >
            </div>
            <div class="item-subtitle">${value.toFixed(2)} €</div>
            <div class="item-after">Order #${key / 2}</div>
          </div>
        </div>
      </li>`;
        }
      });
    } else {
      orderHistoryList.innerHTML = ``;
      orderHistoryList.style.display = "none";
      orderHistoryEmpty.style.display = "block";
    }
  } else if (to == "pastOrders") {
    //pastOrders page
    if (pastOrdersItems != null) {
      pastOrdersPage.style.display = "block";
      pastOrdersList.innerHTML = "";

      Object.entries(pastOrdersItems).forEach(([key, value]) => {
        pastOrdersList.innerHTML += `<li class="item-divider">Order #${key}</li>`;
        Object.entries(value).forEach(([key, item]) => {
          pastOrdersList.innerHTML +=
            '<li><div class="item-content swipeout-content"><div class="item-media serving-counter"><!-- serving - counter --><i class="icon f7-icons if-not-md"><span class="badge color-blue serving-count1">' +
            item.inOrder +
            '</span></i><i class="icon material-icons md-only"><span class="badge color-blue serving-count1">' +
            item.inOrder +
            '</span></i></div><div class="item-inner"><div class="item-title-row"><div class="item-title">' +
            item.name +
            '</div><div class="item-after order-price">' +
            (item.inOrder * item.price).toFixed(2) +
            '€</div></div><div class="item-subtitle">' +
            item.tab +
            "</div></div>";
        });
      });

      pastOrdersList.innerHTML += `<li>
          <div class="item-content">
            <div class="item-inner">
              <div class="item-title-row">
                <div class="item-title" id="totalPast">Subtotal</div>
                <div class="item-after" id="totalPastPrice">${updatePastOrderTotal().toFixed(
                  2
                )} €</div>
              </div>
            </div>
          </div>
        </li>`;
      alreadyOrdered.innerHTML = `${updatePastOrderTotal().toFixed(2)} €`;
    } else {
      pastOrdersPage.style.display = "none";
      pastOrdersList.innerHTML = ``;
      pastOrdersList.innerHTML = "Ordered but unpaid dishes go here!";
    }
  }
}

//========================================================DETAILED-DISH-VIEW STUFF=======================================================================================================================================

function loadDetailedView(from) {
  //load unique detailed-view based on card clicked in dishoverview
  document.getElementById("detailed-scrollable").scrollTo(0, 0);
  let detailedViewImg = document.getElementById("detailed-img");
  detailedViewImg.src = `${selectedDish.imgSrc}`;
  let detailedViewTitle = document.querySelector(".detailed-title");
  let detailedViewDesc = document.querySelector(".detailed-desc");
  let addOnsList = document.querySelector("#addOns-list");
  let stepperDown = document.querySelector(".stepper-button-minus");
  let stepperUp = document.querySelector(".stepper-button-plus");
  let orderedDishes = localStorage.getItem("dishesInOrder");
  let orderedDish = [];
  let imageHeight;
  let body45vh;
  let tooShort;
  let ingredientAccordion = document.getElementById("ingredient-list");
  let allergyWarning = document.getElementById("allergy-paragraph");
  document.getElementById("detailed-img").classList.remove("alter-height");

  orderedDishes = JSON.parse(orderedDishes);

  detailedViewTitle.innerHTML = `${selectedDish.name}`;
  detailedViewDesc.innerHTML = `${selectedDish.description}`;
  ingredientAccordion.innerHTML = addIngredientList();
  allergyWarning.style.display =
    selectedDish.ingredients.filter((element) => allergyArray.includes(element))
      .length == 0
      ? "none"
      : "block";

  stpValueInt = app.stepper.getValue("#steppy");

  //fix incosistent image height
  imageHeight = document.getElementById("detailed-img").height;
  body45vh = 0.45 * document.body.clientHeight;
  tooShort = imageHeight < body45vh ? true : false;
  if (tooShort) {
    document.getElementById("detailed-img").classList.add("alter-height");
  }

  if (from == "dishoverview") {
    app.stepper.setValue("#steppy", 1);
    resetCheckboxes();

    //load rest of elements on page: using data from local storage
    addOnsList.innerHTML = addOns(selectedDish);
    //add-to-order button
    updateDetailedPrice("dontMatter", "dishoverview");

    //update button price when stepper is pressed
    stepperDown.addEventListener("click", () => {
      updateDetailedPrice("dontMatter", "dishoverview");
    });
    stepperUp.addEventListener("click", () => {
      updateDetailedPrice("dontMatter", "dishoverview");
    });
  } else if (from == "orderscreen") {
    //load rest of elements on page: using data from local storage
    for (j = 0; j < selectedDish.id; j++) {
      if (orderedDishes[j + 1] != null) {
        if (selectedDish.id == parseInt(orderedDishes[j + 1].id)) {
          app.stepper.setValue("#steppy", orderedDishes[j + 1].inOrder);
          addOnsList.innerHTML = addOns(selectedDish);
          // add-to-order button
          updateDetailedPrice(orderedDishes[j + 1], "orderscreen");
          orderedDish = orderedDishes[j + 1];
          //update button price when stepper is pressed
          stepperDown.addEventListener("click", () => {
            updateDetailedPrice(orderedDish, "orderscreen");
          });
          stepperUp.addEventListener("click", () => {
            updateDetailedPrice(orderedDish, "orderscreen");
          });
        }
      }
    }
  }
}

function addIngredientList() {
  //Add ingredient list to detailed view
  let ingredientString = "";
  selectedDish.ingredients.forEach((ingredient) => {
    ingredientString += "<li>" + ingredient + "</li>";
  });
  return ingredientString;
}

function addOns(dish) {
  //Add "Add-Ons" list to detailed view
  let addOnString = "";

  dish.addOns.forEach((addOn, i) => {
    let minusSign;
    if (addOn.name.includes("no")) {
      minusSign = "-";
    } else {
      minusSign = "";
    }
    if (addOn.added == true) {
      //check the checkbox - of the particular "Add On"
      addOnString +=
        '<li><label class="item-checkbox item-content"><input type="checkbox" name="demo-checkbox" id="checkbox' +
        i +
        '"  onchange="checkAddOn(' +
        "'" +
        addOn.name +
        "'" +
        ')" checked="true"><i class="icon icon-checkbox"></i><div class="item-inner"><div class="item-title-row"><div class="item-title">' +
        addOn.name +
        '</div></div><div class="item-subtitle">' +
        minusSign +
        addOn.price.toFixed(2) +
        " €</div></div></label></li>";
    } else {
      //dont check the checkbox - of the particular "Add On"
      addOnString +=
        '<li><label class="item-checkbox item-content"><input type="checkbox" name="demo-checkbox" id="checkbox' +
        i +
        '"  onchange="checkAddOn(' +
        "'" +
        addOn.name +
        "'" +
        ')"><i class="icon icon-checkbox"></i><div class="item-inner"><div class="item-title-row"><div class="item-title">' +
        addOn.name +
        '</div></div><div class="item-subtitle">' +
        minusSign +
        addOn.price.toFixed(2) +
        " €</div></div></label></li>";
    }
  });
  return addOnString;
}

function addOnsPrice(dish) {
  //increment/decrement the dish total in the detailedView based on addOns price
  let checkedItems = localStorage.getItem("addOnsChecked");
  checkedItems = JSON.parse(checkedItems);
  let addOnsPrice = 0;
  dish.addOns.forEach((addOn) => {
    if (checkedItems != null) {
      if (checkedItems[`${dish.id}_${addOn.name}`] == undefined) {
        checkedItems = {
          ...checkedItems,
          [`${dish.id}_${addOn.name}`]: addOn,
        };
        if (checkedItems[`${dish.id}_${addOn.name}`].added == true) {
          if (addOn.name.includes("no")) {
            //if the word contains no - decrement total
            addOnsPrice -= addOn.price;
          } else {
            //else if the word contains extra - add to total
            addOnsPrice += addOn.price;
          }
        } else {
          addOnsPrice += 0;
        }
      } else {
        if (checkedItems[`${dish.id}_${addOn.name}`].added == true) {
          if (addOn.name.includes("no")) {
            //if the word contains no - decrement total
            addOnsPrice -= addOn.price;
          } else {
            //else if the word contains extra - add to total
            addOnsPrice += addOn.price;
          }
        } else {
          addOnsPrice += 0;
        }
      }
    }
  });
  return addOnsPrice;
}

function resetCheckboxes() {
  //uncheck all the checkboxes and reset the "Add Ons".added to false
  let checkedItems = localStorage.getItem("addOnsChecked");
  let orderItems = localStorage.getItem("dishesInOrder");

  orderItems = JSON.parse(orderItems);
  checkedItems = JSON.parse(checkedItems);

  dishes.forEach((dish) => {
    if (orderItems != null) {
      if (orderItems[dish.id] === null) {
        dish.addOns.forEach((addOn) => {
          addOn.added = false;
          if (checkedItems != null) {
            if (checkedItems[`${dish.id}_${addOn.name}`] == undefined) {
              checkedItems = {
                ...checkedItems,
                [`${dish.id}_${addOn.name}`]: addOn,
              };
            } else {
              checkedItems[`${dish.id}_${addOn.name}`].added = false;
            }
          }
          localStorage.setItem("addOnsChecked", JSON.stringify(checkedItems));
        });
      }
    }
  });
}

function checkAddOn(checkedAddOnName) {
  //modify the clicked on "Add On".added to true/false and update localStorage
  let checkedItems = localStorage.getItem("addOnsChecked");
  checkedItems = JSON.parse(checkedItems);

  selectedDish.addOns.forEach((addOn, i) => {
    if (addOn.name == checkedAddOnName) {
      addOn.added = addOn.added ? false : true;
      if (checkedItems != null) {
        if (checkedItems[`${selectedDish.id}_${addOn.name}`] == undefined) {
          checkedItems = {
            ...checkedItems,
            [`${selectedDish.id}_${addOn.name}`]: addOn,
          };
        } else {
          checkedItems[`${selectedDish.id}_${addOn.name}`].added = addOn.added;
        }
      } else {
        checkedItems = {
          [`${selectedDish.id}_${addOn.name}`]: addOn,
        };
      }
    } else {
    }
    localStorage.setItem("addOnsChecked", JSON.stringify(checkedItems));
  });
  if (
    document.getElementById("add-button").innerHTML.slice(0, 12) ==
    "Add to order"
  ) {
    updateDetailedPrice(selectedDish, "dishoverview");
  } else {
    updateDetailedPrice(selectedDish, "orderscreen");
  }
}

function updateDetailedPrice(dish, from) {
  //update price on "add-to-order"/"update order"  button in detailedView as stepper is increased/decreased
  let addToOrderBtn = document.querySelector(".detailedBtn-block");
  let buttonPrice = 0;

  stpValueInt = app.stepper.getValue("#steppy");

  if (from == "dishoverview") {
    buttonPrice = parseFloat(
      selectedDish.price * stpValueInt + addOnsPrice(selectedDish)
    );
    //add-to-order button
    addToOrderBtn.innerHTML = `<div class="block">
      <a
        onclick="addDish(dishes[${selectedDish.id - 1}],'detailedView');"
        href="#view-dishoverview"
        class="col button button-large button-fill button-raised tab-link text-color-black"
        id="add-button"
        >Add to order • ${buttonPrice.toFixed(2)} €
      </a>
    </div>`;
  } else if (from == "orderscreen") {
    buttonPrice = parseFloat(
      dish.price * stpValueInt + addOnsPrice(selectedDish)
    );
    // add-to-order button
    if (stpValueInt == 0) {
      addToOrderBtn.innerHTML = `<div class="block">
        <a
          onclick="showLoading(1);deleteDish(dishes[${selectedDish.id - 1}]);"
          href="#view-order"
          class="col button button-large button-fill button-raised tab-link text-color-black"
          id="add-button"
          >Delete Dish</a></div>`;
    } else {
      addToOrderBtn.innerHTML = `<div class="block">
    <a
      onclick="addDish(dishes[${dish.id - 1}],'orderscreen');"
      href="#view-dishoverview"
      class="col button button-large button-fill button-raised tab-link text-color-black"
      id="add-button"
      >Update Order • ${buttonPrice.toFixed(2)} €
    </a>
  </div>`;
    }
  }
}

//========================================================PAYMENT STUFF=======================================================================================================================================

function displayPayment(from) {
  //display payment screen with relevant order summary
  let paymentList = document.querySelector(".payment-card");
  let pastPaymentList = document.querySelector(".past-payment-card");
  let orderItems = localStorage.getItem("dishesInOrder");
  let pastOrderItems = localStorage.getItem("pastOrders");

  orderItems = JSON.parse(orderItems);
  pastOrderItems = JSON.parse(pastOrderItems);
  paymentList.innerHTML = "";
  pastPaymentList.innerHTML = "";

  paymentButtonOnclick("remove");

  if (from == "order") {
    printOrderSummary(orderItems, paymentList);
    paymentList.style.paddingBottom = "16px";
    if (pastOrderItems) {
      //show pastOrders summary
      pastPaymentList.style.display = "block";
      if (pastOrderItems) {
        paymentList.style.paddingBottom = "0px";
        Object.entries(pastOrderItems).forEach(([key, pastOrders]) => {
          printOrderSummary(pastOrders, pastPaymentList);
        });
      }
    } else {
      //hide pastOrders summary
      pastPaymentList.style.display = "none";
    }

    printPaymentPrice(from);
    paymentButtonOnclick("set", 1);
  } else if (from == "pastOrders") {
    //hide pastOrders summary
    pastPaymentList.style.display = "none";
    paymentList.style.paddingBottom = "16px";

    Object.entries(pastOrderItems).forEach(([key, pastOrders]) => {
      printOrderSummary(pastOrders, paymentList);
    });
    printPaymentPrice(from);
    paymentButtonOnclick("set", 2);
  }
}

function printPaymentPrice(from) {
  //print the total of all items in the payment screen summary
  let paymentPrice = document.querySelector(".payment-price");
  paymentPrice.innerHTML = "";

  if (from == "order") {
    paymentPrice.innerHTML += `${(
      updateOrderTotal() + updatePastOrderTotal()
    ).toFixed(2)} €`;
  } else if (from == "pastOrders") {
    paymentPrice.innerHTML += `${updatePastOrderTotal().toFixed(2)} €`;
  }
}

function printOrderSummary(items, list) {
  //populate the payment screen card with the relevant dishes
  Object.values(items).forEach((item) => {
    list.innerHTML += `<span class="dish">${item.name} (x${
      item.inOrder
    })</span><span class="price">${(
      item.inOrder * item.price +
      addOnsPrice(item)
    ).toFixed(2)} €</span><br />`;
  });
}

function paymentButtonOnclick(action, variation) {
  //add/remove event listener to the "confirm-button" in payment screen
  let paymentButton = document.querySelector("#confirm-button");

  if (action == "set") {
    if (variation == 1) {
      //onclicks relevant to adding stuff from active-order to OrderHistory
      paymentButton.setAttribute(
        "onclick",
        "showLoading(1);app.tab.show('#view-homescreen');setItems('doesntMatter', 'paymentScreen');deleteDish('All');deleteDish('pastOrders');loadTo('orderHistory');displayOrders();resetCheckboxes();displayToolbar(1)"
      );
    } else if (variation == 2) {
      //onclicks relevant to adding stuff from pastOrders to OrderHistory
      paymentButton.setAttribute(
        "onclick",
        "showLoading(1);app.tab.show('#view-homescreen');setItems('doesntMatter', 'pastOrders');deleteDish('pastOrders');loadTo('orderHistory');displayOrders();resetCheckboxes();displayToolbar(1)"
      );
    }
  } else if (action == "remove") {
    //resetting/removing all the onclicks on "confirm-button"
    paymentButton.removeAttribute(
      "onclick",
      'showLoading(1);app.tab.show("#view-homescreen");setItems("doesntMatter", "paymentScreen");deleteDish("All");loadTo("orderHistory");displayOrders();displayToolbar(1)'
    );
    paymentButton.removeAttribute(
      "onclick",
      'showLoading(1);app.tab.show("#view-homescreen");setItems("doesntMatter", "pastOrders");deleteDish("pastOrders");loadTo("orderHistory");displayOrders();displayToolbar(1)'
    );
  }
}

//========================================================HOMESCREEN STUFF=======================================================================================================================================

$(document).on("page:beforein", '.page[data-name="homescreen"]', function (e) {
  displayRestaurant();
});

function displayRestaurant() {
  //display restaurant card
  document.querySelector(".restaurant-card").innerHTML = `<div
  style="background-image: url(assets/Restaurant1.jpg)"
  class="card-header align-items-flex-end"
>
  Meritiamo un aumento
</div>
<div class="card-content card-content-padding">
  <p>
  Meritiamo un aumento specializes in delicious food featuring fresh ingredients and masterful preparation by the Meritiamo un aumento culinary team. Whether you’re ordering a multi-course meal or grabbing a drink and pizza at the bar, Meritiamo un aumento's lively, casual yet upscale atmosphere makes it perfect for dining with friends, family, clients and business associates.
  </p>
</div>
<div class="card-footer">
  <a href="#view-restaurant-info" class="tab-link">Our History</a>
</div>`;
}

function changeButtonState(button) {
  //change "call-a-waiter"/"d-n-d" button state after clicked
  let btn = document.querySelector(button);
  let pressed = btn.classList.contains("button-fill");

  if (button == ".call-a-waiter") {
    if (pressed) {
      app.dialog.confirm(
        "Waiter will no longer come",
        "Do you want to cancel?",
        () => {
          btn.classList.remove("button-fill");
          btn.classList.remove("text-color-black");
          btn.classList.add("button-outline");
          btn.innerHTML = "Call a Waiter";
        }
      );
    } else {
      //alert
      app.dialog.alert(
        `A waiter will be with you soon. You can also shake your phone to call a waiter.<br><i class="material-icons md-10 shake-phone-icon">vibration</i>`,
        "Waiter has been called"
      );
      btn.classList.remove("button-outline");
      btn.classList.add("button-fill");
      btn.classList.add("text-color-black");
      btn.color = "#1c1c1c";
      btn.color = "#bbce21";
      btn.innerHTML = "Cancel Waiter";
    }
  } else {
    if (pressed) {
      app.dialog.confirm(
        "Warning: you can be bothered again",
        "Do you want to disable?",
        () => {
          btn.classList.remove("button-fill");
          btn.classList.remove("text-color-black");
          btn.classList.add("button-outline");
          btn.color = "#bbce21";
          btn.innerHTML = "Do not Disturb";
        }
      );
    } else {
      //alert
      app.dialog.alert(
        "A waiter wont bother you anymore",
        "Do Not Disturb Mode Enabled"
      );
      btn.classList.remove("button-outline");
      btn.classList.add("button-fill");
      btn.classList.add("text-color-black");
      btn.color = "#1c1c1c";
      btn.innerHTML = "Quit DND Mode";
    }
  }
}

//========================================================FAVOURITE STUFF=======================================================================================================================================

function showDetailedHeader() {
  //access the favourite boolean of the currently selected channel.
  document.querySelector(".favourite-button").innerHTML = selectedDish.favourite
    ? "favorite"
    : "favorite_border";
}

function favouriteDish() {
  // Toggles favourite property of dish and displays dish accordingly in panel
  selectedDish.favourite = selectedDish.favourite ? false : true;
  dishes.forEach((dish) => {
    if (dish.id == selectedDish.id) {
      dish = selectedDish;
    }
  });
  displaySelected();
  switchDish(selectedDish.id);
  document
    .querySelector(".favourite-panel")
    .setAttribute(
      "onclick",
      "displaySelected();displayToolbar(1);displayTab('#view-favourites')"
    );
}

function displaySelected() {
  //populate the favourites page with favourite-dishes
  const favouriteList = document.getElementById("favourites-list");
  let favouritesEmpty = document.getElementById("favourites-img");
  favouriteList.innerHTML = ""; // making sure that there is no content inside these two lists
  let notFavourite = 0;

  favouriteList.style.display = "block";
  favouritesEmpty.style.display = "none";
  //The code below takes the empty favourite list, and loads the dishes into this list
  dishes.forEach((dish) => {
    if (dish.favourite) {
      favouriteList.innerHTML += `<li>
      <div class="item-content">
        <div class="item-media detailed">
          <img
            id="restaurant-img"
            src="${dish.imgSrc}"
            width="61"
            height="61"
          />
        </div>
        <div class="item-inner">
          <div class="item-title-row">
            <div class="item-title">${dish.name}</div>
            <a
              href="#"
              class="
                col
                button button-small button-round button-outline
                order-again
              "
              onclick="showLoading(0.6);"
              >Order</a
            >
          </div>
          <div class="item-subtitle">${dish.price.toFixed(2)} €</div>
        </div>
      </div>
    </li>`;
    } else {
      notFavourite++;
    }
  });

  if (dishes.length - notFavourite == 0) {
    /* if there are no favourite dishes */
    favouriteList.innerHTML = ``;
    favouriteList.style.display = "none";
    favouritesEmpty.style.display = "block";
  }

  //always add selected class to current dish
  if (!!selectedDish) {
    document.getElementById(selectedDish.id).classList.add("selected");
  }
}

function switchDish(selectedDishID) /*dish in detailed view.*/ {
  if (!!selectedDish) {
    if (!!document.getElementById(selectedDish.id)) {
      document.getElementById(selectedDish.id).classList.remove("selected");
    }
  }
  document.getElementById(selectedDishID).classList.add("selected");
  dishes.forEach((dish) => {
    if (dish.id == selectedDishID) {
      selectedDish = dish;
    }
  });
  showDetailedHeader();
}

//========================================================MISCELLANEUOS STUFF=======================================================================================================================================

function checkout() {
  //checkout from the restaurarnt: if there are no current orders/past orders active
  let pastOrdersItems = localStorage.getItem("pastOrders");
  let orderItems = localStorage.getItem("dishesInOrder");

  if (pastOrdersItems == null && updateOrderCount() > 0) {
    //alert
    app.dialog.alert("You have items in your order list", "Unable to checkout");
  } else if (pastOrdersItems && orderItems == null) {
    //alert
    app.dialog.alert(
      "You have to pay for your past orders",
      "Unable to checkout"
    );
  } else if (pastOrdersItems && updateOrderCount() > 0) {
    //alert
    app.dialog.alert(
      "You have to pay for your past orders and you have items in your order list",
      "Unable to checkout"
    );
  } else {
    displayToolbar(0);
    showLoading(1);
    deleteDish("All");
    displayOrders();
    app.tab.show("#view-preorder");
    //remove your dishes are being prepared
    document.getElementById("prep").innerHTML = ``;
  }
}

//show preloader for specified number of seconds
function showLoading(seconds) {
  //1 second = 1000 milliseconds
  let milliseconds = seconds * 1000;

  app.preloader.show();
  setTimeout(() => {
    app.preloader.hide();
  }, milliseconds);
}

function initSwipeout() {
  // swipeout preview when app used for the first time
  if (updateOrderCount() > 0) {
    //will only show when there is an item in the active order
    setTimeout(() => {
      app.swipeout.open(".swiper", "right", () => {
        setTimeout(() => {
          app.swipeout.close(`.swiper`);
        }, 1000);
      });
    }, 1500);
  } else {
    return;
  }
}

function checkAnswer() {
  //Mini Game on Entertainment-view. User has to correctly order the items to win
  let arrayEntertainment = [];
  let correctOrder = ["Water", "Kombucha", "Beer", "Wine", "Grappa"];
  var alcoholDiv = document.getElementById("alcohol-list");
  var liElements = alcoholDiv.getElementsByTagName("li");
  for (var i = 0; i < liElements.length; i += 1) {
    arrayEntertainment.push(liElements[i].innerText);
  }
  if (correctOrder.toString() === arrayEntertainment.toString()) {
    app.dialog.alert("Well done! That was the correct answer");
  } else {
    app.dialog.alert("Try again!");
  }
}

//===================================================================TIC TAC TOE GAME=======================================================================
/* sources: https://github.com/WebDevSimplified/JavaScript-Tic-Tac-Toe.git */

const X_CLASS = "x";
const CIRCLE_CLASS = "circle";
const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
let circleTurn;

function startGame() {
  displayToolbar(0);
  //======================================================================
  const cellElements = document.querySelectorAll("[data-cell]");
  const winningMessageElement = document.getElementById("winningMessage");
  const restartButton = document.getElementById("restartButton");
  //======================================================================
  restartButton.addEventListener("click", startGame);
  circleTurn = false;
  cellElements.forEach((cell) => {
    cell.classList.remove(X_CLASS);
    cell.classList.remove(CIRCLE_CLASS);
    cell.removeEventListener("click", handleClick);
    cell.addEventListener("click", handleClick, { once: true });
  });
  setBoardHoverClass();
  winningMessageElement.classList.remove("show");
}

function handleClick(e) {
  const cell = e.target;
  const currentClass = circleTurn ? CIRCLE_CLASS : X_CLASS;
  placeMark(cell, currentClass);
  if (checkWin(currentClass)) {
    endGame(false);
  } else if (isDraw()) {
    endGame(true);
  } else {
    swapTurns();
    setBoardHoverClass();
  }
}

function endGame(draw) {
  //=======================================================================
  const winningMessageElement = document.getElementById("winningMessage");
  const winningMessageTextElement = document.querySelector(
    "[data-winning-message-text]"
  );
  //========================================================================
  if (draw) {
    winningMessageTextElement.innerText = "Draw!";
  } else {
    winningMessageTextElement.innerText = `${circleTurn ? "O's" : "X's"} Wins!`;
  }
  winningMessageElement.classList.add("show");
}

function isDraw() {
  //=========================================================================
  const cellElements = document.querySelectorAll("[data-cell]");
  //=========================================================================
  return [...cellElements].every((cell) => {
    return (
      cell.classList.contains(X_CLASS) || cell.classList.contains(CIRCLE_CLASS)
    );
  });
}

function placeMark(cell, currentClass) {
  cell.classList.add(currentClass);
}

function swapTurns() {
  circleTurn = !circleTurn;
}

function setBoardHoverClass() {
  board.classList.remove(X_CLASS);
  board.classList.remove(CIRCLE_CLASS);
  if (circleTurn) {
    board.classList.add(CIRCLE_CLASS);
  } else {
    board.classList.add(X_CLASS);
  }
}

function checkWin(currentClass) {
  //============================================================
  const cellElements = document.querySelectorAll("[data-cell]");
  //============================================================
  return WINNING_COMBINATIONS.some((combination) => {
    return combination.every((index) => {
      return cellElements[index].classList.contains(currentClass);
    });
  });
}
//===================================================================TIC TAC TOE GAME:footer=======================================================================
