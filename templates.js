var Templates = {
    cardType: function(count) {
        return `
                                <div class="form-group" id="card-type-${count}-container">
                                    <div class="dropdown col-xs-2">
                                        <button class="btn btn-default dropdown-toggle" type="button" id="card-options-${count}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">☰</button>
                                        <ul class="dropdown-menu" aria-labelledby="card-options-${count}">
                                            <li><a class="dropdown-item" href="#" type="button" data-action="alternatives" data-id="${count}">How many should I play?</a></li>
                                        </ul>
                                    </div>
                                    <div class="col-xs-4">
                                        <input class="col-xs-4 form-control card-types-input card-types-name" id="card-type-${count}-name" placeholder="Card Name"/>
                                    </div>
                                    <div class="col-xs-2">
                                        <input type="text" class="form-control number-input card-types-amt" id="card-type-${count}-amt" placeholder="3">
                                    </div>
                                    <div class="col-xs-2">
                                        <input type="text" class="form-control number-input card-types-min" id="card-type-${count}-min" placeholder="1">
                                    </div>
                                    <div class="col-xs-2">
                                        <input type="text" class="form-control number-input card-types-max" id="card-type-${count}-max" placeholder="3">
                                    </div>
                                </div>
        `;
    }
    
};
