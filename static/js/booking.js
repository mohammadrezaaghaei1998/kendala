document.addEventListener("DOMContentLoaded", function() {
    let count = 0;
    const countElement = document.getElementById("count");
    const increaseBtn = document.getElementById("increase");
    const decreaseBtn = document.getElementById("decrease");

    increaseBtn.addEventListener("click", function() {
        count++;
        countElement.textContent = count;
    });

    decreaseBtn.addEventListener("click", function() {
        if (count > 0) { 
            count--;
            countElement.textContent = count;
        }
    });
});













  const expiryInput = document.getElementById('expiry');

        expiryInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, ''); 

            if (value.length >= 3) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }

            e.target.value = value;
        });










  document.addEventListener('DOMContentLoaded', function() {
            let count = 1;
            const countDisplay = document.getElementById('count');
            const travelersAssignText = document.querySelector('.travelers-count');
            const travelersRoomText = document.querySelector('.accommodation-recommended-room-wrapper p');
            const formContainer = document.querySelector('.askaquestion');

            const decreaseBtn = document.getElementById('decrease');
            const increaseBtn = document.getElementById('increase');

            function updateDisplay() {
                countDisplay.textContent = count;
                
                // update BOTH texts
                if (travelersAssignText) travelersAssignText.textContent = count + (count === 1 ? " Traveler" : " Travelers");
                if (travelersRoomText) travelersRoomText.textContent = count + (count === 1 ? " Traveler" : " Travelers");
                
                generateForms(count);
            }

            decreaseBtn.addEventListener('click', function() {
                if (count > 1) {
                    count--;
                    updateDisplay();
                }
            });

            increaseBtn.addEventListener('click', function() {
                count++;
                updateDisplay();
            });

            function generateForms(numTravelers) {
                let html = '';

                 for (let i = 1; i <= numTravelers; i++) {
                    html += `
                    <div class="traveler-form mb-4">
                        <h6><strong>Traveler ${i}</strong></h6>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <input class="input" type="text" placeholder="First Name *"/>
                            </div>
                            <div class="col-md-6 mb-3">
                                <input class="input" type="text" placeholder="Last Name *"/>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <input class="input" type="text" placeholder="Phone Number (optional)"/>
                            </div>
                            <div class="col-md-6 mb-3">
                                <input class="input" type="email" placeholder="Email Address *"/>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-6 minput">
                                <div class="select">
                                    <select class="input">
                                        <option value="">Nationality</option>
                                        <option value="morocco">Morocco</option>
                                        <option value="algeria">Algeria</option>
                                        <option value="tunisia">Tunisia</option>
                                    </select>
                                    <div class="select__arrow"></div>
                                </div>
                            </div>
                        </div>

                        <div class="row mt-4">
                            <div class="col-3 minput">
                                <div class="select">
                                    <select class="input">
                                        <option value="">DD</option>
                                        ${Array.from({length:31}, (_,d)=>`<option>${String(d+1).padStart(2,'0')}</option>`).join('')}
                                    </select>
                                    <div class="select__arrow"></div>
                                </div>
                            </div>
                            <div class="col-3 minput">
                                <div class="select">
                                    <select class="input">
                                        <option value="">MM</option>
                                        <option>January</option><option>February</option><option>March</option>
                                        <option>April</option><option>May</option><option>June</option>
                                        <option>July</option><option>August</option><option>September</option>
                                        <option>October</option><option>November</option><option>December</option>
                                    </select>
                                    <div class="select__arrow"></div>
                                </div>
                            </div>
                            <div class="col-3 minput">
                                <div class="select">
                                    <select class="input">
                                        <option value="">YY</option>
                                        ${Array.from({length:80}, (_,y)=>`<option>${1945+y}</option>`).join('')}
                                    </select>
                                    <div class="select__arrow"></div>
                                </div>
                            </div>
                        </div>

                        <div class="row mt-4 mb-3">
                            <div class="col-12 control-group">
                                <div class="row align-items-start">
                                    <div class="col-auto">
                                        <span class="sex">Gender :</span>
                                    </div>
                                    <label class="control control--radio">Male
                                        <input type="radio" name="gender${i}" />
                                        <div class="control__indicator"></div>
                                    </label>
                                    <label class="control control--radio">Female
                                        <input type="radio" name="gender${i}" />
                                        <div class="control__indicator"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    `;

                    // Only first traveler gets address, city etc
                    if (i === 1) {
                        html += `
                        <div class="row mb-4">
                            <div class="col-6 minput">
                                <div class="select">
                                    <select class="input">
                                        <option value="">Country</option>
                                        <option value="morocco">Morocco</option>
                                        <option value="algeria">Algeria</option>
                                        <option value="tunisia">Tunisia</option>
                                    </select>
                                    <div class="select__arrow"></div>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <input class="input" type="text" placeholder="Address *"/>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <input class="input" type="text" placeholder="City *"/>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <input class="input" type="text" placeholder="Postal Or Zip Code *"/>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <input class="input" type="text" placeholder="State or Province *"/>
                            </div>
                        </div>`;
                    }
                    html += `<hr></div>`;
                }


                formContainer.innerHTML = html + `
                    <button class="red" type="button"><i class="icon ion-md-lock"></i> Submit</button>
                `;
            }

            // Init
            updateDisplay();
        });














document.addEventListener('DOMContentLoaded', function() {
    const promoLink = document.getElementById('redeemPromoLink');
    const promoContainer = document.querySelector('.promo-code-container');

    promoLink.addEventListener('click', function(e) {
        e.preventDefault();
        promoContainer.classList.toggle('show');
    });
});












document.addEventListener('DOMContentLoaded', function() {
    const cardRadio = document.getElementById('pay_card');
    const paypalRadio = document.getElementById('pay_paypal');
    const cardSection = document.getElementById('paybycard-section');
    const paypalSection = document.getElementById('paypal-section');

    function togglePayment() {
        if(cardRadio.checked) {
            cardSection.style.display = 'block';
            paypalSection.style.display = 'none';
        } else if(paypalRadio.checked) {
            cardSection.style.display = 'none';
            paypalSection.style.display = 'block';
        }
    }

    cardRadio.addEventListener('change', togglePayment);
    paypalRadio.addEventListener('change', togglePayment);

    togglePayment();
});