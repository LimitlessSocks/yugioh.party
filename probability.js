var cardTypes, SessionState;
var SESSION_STORAGE_KEY = "sock/yugioh.party";
var DEFAULT_SESSION_STATE = {
    cardTypeCount: 1,
    deckSize: 40,
    handSize: 5,
    cardTypeValues: [
        ["", "", "", ""],
    ],
};

$(document).ready(function () {
    var SessionState = DEFAULT_SESSION_STATE;
    sessionStorage[SESSION_STORAGE_KEY] = sessionStorage[SESSION_STORAGE_KEY] || JSON.stringify(SessionState);
    SessionState = JSON.parse(sessionStorage[SESSION_STORAGE_KEY]);
    
    cardTypes = new CardTypes();
    cardTypes.syncFromState(SessionState);

    $("#deck-size").on("change paste keypress", numberInputChange);
    $("#hand-size").on("change paste keypress", numberInputChange);

    $("body").on("change paste keypress", ".card-types-name", updateSessionStorage);
    $("body").on("change paste keypress", ".card-types-amt", numberInputChange);
    $("body").on("change paste keypress", ".card-types-min", numberInputChange);
    $("body").on("change paste keypress", ".card-types-max", numberInputChange);

    $("body").on("keyup", ".number-input", function (e) {
        if (e.keyCode == 38 || e.keyCode == 40) {
            var val = e.target.value;
            if (val === "") {
                val = 0;
            }

            val = parseInt(val, 10);
            val += (e.keyCode == 38) ? 1 : -1;

            e.target.value = val;

            if (e.target.id.indexOf("amt") != -1) {
                var c = e.target.id.split("-")[2];

                var min = $("#card-type-" + c + "-min");
                if (min.val() == "") {
                    min.val(1);
                }

                var max = $("#card-type-" + c + "-max");
                if (max.val() == "") {
                    max.val(e.target.value);
                }
            }
            
            updateNumbers();
        }
    });

    $("body").on("keyup", "#deck-size, #hand-size, .card-types-amt, .card-types-min, .card-types-max", function (e) {
        if (e.keyCode === 8 || e.keyCode === 46) {
            updateNumbers();
        }
    });

    $("#card-types-add-button").click(function (e) {
        e.preventDefault();

        cardTypes.addCardType();
        updateSessionStorage();
    });

    $("#card-types-sub-button").click(function (e) {
        e.preventDefault();

        cardTypes.removeCardType();
        updateNumbers();
        calculate();
        updateSessionStorage();
    });
    
    $("#card-types-reset-button").click(function (e) {
        e.preventDefault();
        
        SessionState = DEFAULT_SESSION_STATE;
        cardTypes.syncFromState(SessionState);
        updateSessionStorage();
    });
    
    updateNumbers();
    calculate();
});

function handleMenuClick(e) {
    e.preventDefault();
    var dataset = e.target.dataset;
    var action = dataset.action;
    var id = parseInt(dataset.id, 10);
    
    if (action === "alternatives") {
        showCardOptions(id);
    }
    else {
        console.error("Unhandled action for expanded menu:", action, "Id:", id);
    }
}

function showCardOptions(id) {
    var deckSize = getDeckSize();
    var handSize = getHandSize();
    
    var objects = getCardAmounts();
    var params = { deckSize: deckSize, handSize: handSize };
    
    var baseObjects = objects.slice(0, id).concat(objects.slice(id + 1));
    var baseRate = calculateNoUI(baseObjects, params);
    
    var originalObject = objects[id];
    
    // console.log("Sim:", simulate(objects, params));
    console.log({baseRate});
    for(var i = originalObject.min; i <= deckSize; i++) {
        objects[id] = { amt: i, min: originalObject.min, max: i };
        var amount = calculateNoUI(objects, params);
        if(amount > baseRate) {
            break;
        }
        console.log(i, amount);
        //TODO:
    }
}

function numberInputChange(e) {
    e.preventDefault();

    if (e.charCode >= '0'.charCodeAt(0) && e.charCode <= '9'.charCodeAt(0)) {
        var start = e.target.selectionStart;
        var end = e.target.selectionEnd;
        e.target.value = e.target.value.substring(0, start) + String.fromCharCode(e.charCode) + e.target.value.substring(end, e.target.value.length);
        e.target.selectionEnd = start + 1;
        //e.target.value = e.target.value String.fromCharCode(e.charCode);
    }

    if (e.target.id.indexOf("amt") != -1) {
        var c = e.target.id.split("-")[2];

        var min = $("#card-type-" + c + "-min");
        if (min.val() == "") {
            min.val(1);
        }

        var max = $("#card-type-" + c + "-max");
        if (max.val() == "") {
            max.val(e.target.value);
        }
    }

    updateNumbers();
}

function updateNumbers() {
    var deckSize = getDeckSize();
    var handSize = getHandSize();

    var miscAmt = deckSize;
    for (var i = 0; i < cardTypes.count; i++) {
        miscAmt -= getCardAmt(i);
    }

    var miscMax = handSize;
    for (var i = 0; i < cardTypes.count; i++) {
        miscMax -= getCardMin(i);
    }

    var maxError = false;
    for (var i = 0; i < cardTypes.count; i++) {
        var cardAmt = getCardAmt(i);
        var cardMax = getCardMax(i);

        if (cardMax > cardAmt) {
            $("#card-type-" + i + "-max").css("border-color", "red");
            maxError = true;
        } else {
            $("#card-type-" + i + "-max").css("border-color", "");
        }
    }

    if (getHandSize() > getDeckSize()) {
        $("#hand-size").css("border-color", "red");
    } else {
        $("#hand-size").css("border-color", "");
    }

    var cardTypeMinBorderColors = Array(cardTypes.count);
    var failHand = false; //miscAmt < miscMax;
    // this seems to be an unnecessary error (as it does not allow you to have), but we'll log it in case something unexpected breaks
    if(miscAmt < miscMax) {
        console.log(`Note: This hand used to fail, since miscAmt (${miscAmt}) is less than miscMax (${miscMax})`);
    }
    // for (var i = 0; i < cardTypes.count; i++) {
        // cardTypeMinBorderColors[i] = failHand ? "red" : "";
    // }

    var maxMinFail = false;
    for (var i = 0; i < cardTypes.count; i++) {
        var maxMinFailBorderColor = "";
        if (getCardMin(i) > getCardMax(i)) {
            maxMinFail = true;
            maxMinFailBorderColor = "red";
        }
        cardTypeMinBorderColors[i] = cardTypeMinBorderColors[i] || maxMinFailBorderColor;
        $("#card-type-" + i + "-min").css("border-color", cardTypeMinBorderColors[i]);
    }

    if (miscAmt < 0 || miscMax < 0 || maxError || getHandSize() > getDeckSize() || failHand || maxMinFail) {
        valid = false;
    } else {
        valid = true;
    }
    
    if (valid) {
        updateSessionStorage();
    }

    setMiscAmt(miscAmt);
    setMiscMax(miscMax);

    calculate();
}

function getDeckSize() {
    var ret = $("#deck-size").val();
    if (ret === "") {
        ret = 0;
    }

    return parseInt(ret, 10);
}

function getHandSize() {
    var ret = $("#hand-size").val();
    if (ret === "") {
        ret = 0;
    }

    return parseInt(ret, 10);
}

function getMiscAmt() {
    var ret = $("#misc-amt").text();
    if (ret === "") {
        ret = 0;
    }

    return parseInt(ret, 10);
}

function setMiscAmt(val) {
    if (val < 0) {
        $("#misc-amt").css("color", "red");
    } else {
        $("#misc-amt").css("color", "black");
    }

    $("#misc-amt").text(val);
}

function getMiscMin() {
    var ret = $("#misc-min").text();
    if (ret === "") {
        ret = 0;
    }

    return parseInt(ret, 10);
}

function setMiscMin(val) {
    if (val < 0) {
        $("#misc-min").css("color", "red");
    } else {
        $("#misc-min").css("color", "black");
    }

    $("#misc-min").text(val);
}

function getMiscMax() {
    var ret = $("#misc-max").text();
    if (ret === "") {
        ret = 0;
    }

    return parseInt(ret, 10);
}

function setMiscMax(val) {
    if (val < 0) {
        $("#misc-max").css("color", "red");
    } else {
        $("#misc-max").css("color", "black");
    }

    $("#misc-max").text(val);
}

function getCardName(index) {
    var ret = $("#card-type-" + index + "-name").val();
    // if (ret === "") {
        // ret = "Card Name";
    // }

    return ret;
}

function getCardAmt(index) {
    var ret = $("#card-type-" + index + "-amt").val();
    if (ret === "") {
        ret = 0;
    }

    return parseInt(ret, 10);
}

function getCardMin(index) {
    var ret = $("#card-type-" + index + "-min").val();
    if (ret === "") {
        ret = 0;
    }

    return parseInt(ret, 10);
}

function getCardMax(index) {
    var ret = $("#card-type-" + index + "-max").val();
    if (ret === "") {
        ret = 0;
    }

    return parseInt(ret, 10);
}

function getCardAmtRaw(index) {
    return $("#card-type-" + index + "-amt").val();
}

function getCardMinRaw(index) {
    return $("#card-type-" + index + "-min").val();
}

function getCardMaxRaw(index) {
    return $("#card-type-" + index + "-max").val();
}

function setCardName(index, newName) {
    $("#card-type-" + index + "-name").val(newName);
    
    return newName;
}

function setCardAmt(index, newAmt) {
    console.log("setting card amt", index, "to", newAmt);
    $("#card-type-" + index + "-amt").val(newAmt);

    return newAmt;
}

function setCardMin(index, newMin) {
    $("#card-type-" + index + "-min").val(newMin);

    return newMin;
}

function setCardMax(index, newMax) {
    $("#card-type-" + index + "-max").val(newMax);

    return newMax;
}

function getCardAmounts() {
    var objects = [];
    for (var i = 0; i < cardTypes.count; i++) {
        var obj = {
            amt: getCardAmt(i),
            min: getCardMin(i),
            max: getCardMax(i)
        };

        objects.push(obj);
    }
    return objects;
}

var valid = true;
function calculate() {
    if (!valid) {
        $("#percentage").html('<label style="color: red">Unable to calculate. Please fix the values.</label>');
    } else {
        var objects = getCardAmounts();
        
        var params = {
            miscAmt: getMiscAmt(),
            miscMax: getMiscMax(),
            deckSize: getDeckSize(),
            handSize: getHandSize(),
            verbose: true,
        };
        var chance = calculateNoUI(objects, params);
        chance *= 100;

        var color = ["red", "#ff9900", "#ffbf00", "green", "green"][Math.floor(chance / 25)];

        $("#percentage").html('<label>You have a <span style="color: ' + color + '">' + chance.toFixed(2) + '</span>% chance to open this hand.</label>');
    }
}

// https://stackoverflow.com/a/12646864/4119004
function shuffleArray(array) {
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function simulate(objects, params, N = 1000000) {
    var baseDeck = [];
    objects.forEach((obj, objIndex) => {
        for(let i = 0; i < obj.amt; i++) {
            baseDeck.push(objIndex);
        }
    });
    while(baseDeck.length < params.deckSize) {
        baseDeck.push(-1);
    }

    var counts, hand, success, hits = 0;
    
    for(var i = 0; i < N; i++) {
    
        shuffleArray(baseDeck);
        hand = baseDeck.slice(0, params.handSize);
        counts = {};
        hand.forEach(objIndex => counts[objIndex] = (counts[objIndex] || 0) + 1);
        success = objects.every((obj, objIndex) =>
            obj.min <= counts[objIndex] && counts[objIndex] <= obj.max);
        
        if(success) {
            hits += 1;
        }
    }
    
    // console.log(hits, N, hits/N);
    
    return hits / N;
}

// objects is an array of objects { amt:, min:, max: }
// params is an object { deckSize:, handSize:, miscAmt:?, miscMax:?, verbose:? }
function calculateNoUI(objects, params) {
    params = Object.assign({}, params);
    params.verbose = params.verbose || false;
    if (typeof params.miscAmt === "undefined") {
        params.miscAmt = params.deckSize - objects.map(obj => obj.amt).reduce((a, c) => a + c, 0);
        params.miscMax = params.handSize - objects.map(obj => obj.min).reduce((a, c) => a + c, 0);
    }
    if (params.miscMax === 0 && params.deckSize === params.handSize) {
        return 1;
    }
    // else if (params.miscAmt < 0) {
        
    // }
    else {
        var recursive = recursiveCalculate([], 0, objects, params);
        if (params.verbose) {
            console.log(recursive);
        }
        return recursive / choose(params.deckSize, params.handSize);
    }
}

function recursiveCalculate(currentHand, currentHandSize, objects, params) {
    if (objects.length === 0 || currentHandSize >= params.handSize) {
        if (currentHandSize == params.handSize) {
            if (params.verbose) {
                console.log("O: " + objects.length);
            }
            var noChance = false;
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].min != 0) {
                    noChance = true;
                    break;
                }
            }
            
            if (noChance) {
                return 0;
            }
        } else if (currentHandSize > params.handSize) {
            return 0;
        }
        
        var newChance = 1;
        var output = "";

        for (var i = 0; i < currentHand.length; i += 2) {
            var chosen = choose(currentHand[i], currentHand[i + 1]);
            output += "(" + currentHand[i] + " choose " + currentHand[i + 1] + ` = ${chosen}) * `;
            newChance *= chosen;
        }

        if (currentHandSize < params.handSize) {
            var chosen = choose(params.miscAmt, params.handSize - currentHandSize);
            output += "(" + params.miscAmt + " choose " + (params.handSize - currentHandSize) + ` = ${chosen}) * `;
            newChance *= chosen;
        }
        
        if (params.verbose) {
            console.log(output.substring(0, output.length - 3));
        }
        return newChance;
    }

    var obj = objects.pop();
    var chance = 0;

    for (var i = obj.min; i <= obj.max; i++) {

        currentHand.push(obj.amt);
        currentHand.push(i);

        chance += recursiveCalculate(currentHand, currentHandSize + i, objects, params);
        // if (params.verbose) {
            //console.log("N: " + chance);
        // }
        currentHand.pop();
        currentHand.pop();

    }

    objects.push(obj);

    return chance;
}

function factorial(x) {
    x = parseInt(x, 10);
    if (isNaN(x))
        return 1;
    if (x <= 0)
        return 1;
    if (x > 170)
        return Infinity;
    var y = 1;
    for (var i = x; i > 0; i--) {
        y *= i;
    }
    return y;
}

function choose(n, k) {
    n = parseInt(n, 10);
    if (isNaN(n))
        n = 0;
    if (n < 0)
        n = 0;

    k = parseInt(k, 10);
    if (isNaN(k))
        k = 0;
    if (k < 0)
        k = 0;
    
    if (k > n) {
        return 0;
    }

    return (factorial(n)) / (factorial(k) * factorial(n - k));
}

function CardTypes() {
    this.count = 0;

    this.addCardType = function () {
        $("#card-types-container").append(Templates.cardType(this.count));
        $(`#card-options-${this.count} + ul a`).click(handleMenuClick);
        
        this.count++;
        
        if (this.count >= 2) {
            $("#card-types-sub-button").removeAttr("disabled");
        }
    }

    this.removeCardType = function () {
        if (this.count === 0) {
            return;
        }
        this.count--;
        $("#card-type-" + this.count + "-container").remove();

        if (this.count <= 1) {
            $("#card-types-sub-button").attr("disabled", true);
        }
    }
    
    this.syncFromState = function (state) {
        var targetCount = state.cardTypeCount;
        while (this.count < targetCount) {
            this.addCardType();
        }
        while (this.count > targetCount) {
            this.removeCardType();
        }
        for (var i = 0; i < this.count; i++) {
            var row = state.cardTypeValues[i];
            setCardName(i, row[0]);
            setCardAmt(i,  row[1]);
            setCardMin(i,  row[2]);
            setCardMax(i,  row[3]);
        }
    };
    
    this.getCardTypeValues = function () {
        var cardTypeValues = Array(this.count);
        for (var i = 0; i < this.count; i++) {
            cardTypeValues[i] = [
                getCardName(i),
                getCardAmtRaw(i),
                getCardMinRaw(i),
                getCardMaxRaw(i),
            ];
        }
        return cardTypeValues;
    };
    
    this.toSaveState = function () {
        // technically bad practice since this function is responsible for gathering information from other places but whatever
        
        return {
            cardTypeCount: this.count,
            deckSize: getDeckSize(),
            handSize: getHandSize(),
            cardTypeValues: this.getCardTypeValues(),
        };
    };
}

// i'm not a fan of bootstrapped functions like this, but i guess i'll follow the "style"
function updateSessionStorage () {
    SessionState = cardTypes.toSaveState();
    sessionStorage[SESSION_STORAGE_KEY] = JSON.stringify(SessionState);
}
