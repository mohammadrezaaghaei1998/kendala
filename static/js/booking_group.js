



(() => {



    "use strict";







    const root = document.getElementById("kd-checkout");







    if (!root) return;







    function showToast(message, type = "error") {

        const icons = {

            success: "✓",

            error: "✕",

            warning: "!",

            info: "i"

        };



        const titles = {

            success: "Success",

            error: "Booking details required",

            warning: "Attention required",

            info: "Ken Dala"

        };



        const duration = 7000;



        // Add styles once

        if (!document.getElementById("kd-toast-styles")) {

            const style = document.createElement("style");

            style.id = "kd-toast-styles";

            style.textContent = `

                #kd-toast-container {

                    position: fixed;

                    top: 95px;

                    right: 24px;

                    width: min(370px, calc(100vw - 32px));

                    display: flex;

                    flex-direction: column;

                    gap: 12px;

                    z-index: 999999;

                    pointer-events: none;

                }



                .kd-toast {

                    --toast-color: #850078;

                    --toast-bg: #f8eaf6;

                    display: flex;

                    align-items: flex-start;

                    gap: 12px;

                    position: relative;

                    padding: 17px 18px 20px;

                    border-radius: 14px;

                    border-left: 4px solid var(--toast-color);

                    background: #fff;

                    box-shadow: 0 10px 40px rgba(0,0,0,.12);

                    pointer-events: auto;

                    overflow: hidden;

                    animation: kdSlideIn .4s cubic-bezier(.34,1.56,.64,1) both;

                }



                .kd-toast-error {

                    --toast-color: #ef4444;

                    --toast-bg: #fef2f2;

                }



                .kd-toast-success {

                    --toast-color: #10b981;

                    --toast-bg: #ecfdf5;

                }



                .kd-toast-warning {

                    --toast-color: #f59e0b;

                    --toast-bg: #fffbeb;

                }



                .kd-toast-icon {

                    width: 36px;

                    height: 36px;

                    border-radius: 10px;

                    display: grid;

                    place-items: center;

                    flex-shrink: 0;

                    background: var(--toast-bg);

                    color: var(--toast-color);

                    font-size: 19px;

                    font-weight: 700;

                }



                .kd-toast-body {

                    flex: 1;

                    min-width: 0;

                }



                .kd-toast-title {

                    font-size: 14px;

                    font-weight: 700;

                    color: #161616;

                    margin-bottom: 5px;

                }



                .kd-toast-message {

                    font-size: 12.5px;

                    color: #666;

                    line-height: 1.65;

                    white-space: pre-line;

                    max-height: 45vh;

                    overflow-y: auto;

                    overflow-wrap: anywhere;

                }



                .kd-toast-close {

                    border: none;

                    background: transparent;

                    color: #aaa;

                    font-size: 20px;

                    cursor: pointer;

                    padding: 0;

                    line-height: 1;

                }



                .kd-toast-close:hover {

                    color: #222;

                }



                .kd-toast-progress {

                    position: absolute;

                    bottom: 0;

                    left: 0;

                    height: 3px;

                    width: 100%;

                    background: var(--toast-color);

                    opacity: .65;

                    transform-origin: left;

                    animation: kdToastCountdown var(--duration) linear forwards;

                }



                .kd-toast.removing {

                    animation: kdSlideOut .3s ease-in forwards;

                }



                @keyframes kdSlideIn {

                    from {

                        opacity: 0;

                        transform: translateX(120%) scale(.9);

                    }

                    to {

                        opacity: 1;

                        transform: translateX(0) scale(1);

                    }

                }



                @keyframes kdSlideOut {

                    to {

                        opacity: 0;

                        transform: translateX(120%) scale(.9);

                    }

                }



                @keyframes kdToastCountdown {

                    to { transform: scaleX(0); }

                }



                @media (max-width: 480px) {

                    #kd-toast-container {

                        right: 16px;

                        top: 85px;

                    }

                }



                @media (prefers-reduced-motion: reduce) {

                    .kd-toast, .kd-toast.removing,

                    .kd-toast-progress {

                        animation: none;

                    }

                }

            `;

            document.head.appendChild(style);

        }



        let container = document.getElementById("kd-toast-container");



        if (!container) {

            container = document.createElement("div");

            container.id = "kd-toast-container";

            document.body.appendChild(container);

        }



        const validType = Object.hasOwn(icons, type) ? type : "info";



        // Remove previous notifications to avoid overcrowding

        container.querySelectorAll(".kd-toast").forEach(el => el.remove());



        const el = document.createElement("div");

        el.className = `kd-toast kd-toast-${validType}`;

        el.style.setProperty("--duration", `${duration}ms`);

        el.setAttribute("role", validType === "error" ? "alert" : "status");



        const icon = document.createElement("div");

        icon.className = "kd-toast-icon";

        icon.textContent = icons[validType];



        const body = document.createElement("div");

        body.className = "kd-toast-body";



        const title = document.createElement("div");

        title.className = "kd-toast-title";

        title.textContent = titles[validType];



        const description = document.createElement("div");

        description.className = "kd-toast-message";

        description.textContent = message;



        const close = document.createElement("button");

        close.type = "button";

        close.className = "kd-toast-close";

        close.textContent = "×";

        close.setAttribute("aria-label", "Close notification");



        const progress = document.createElement("div");

        progress.className = "kd-toast-progress";



        body.append(title, description);

        el.append(icon, body, close, progress);

        container.appendChild(el);



        let timer;

        let remaining = duration;

        let started = Date.now();

        let dismissed = false;



        function dismiss() {

            if (dismissed) return;

            dismissed = true;

            clearTimeout(timer);

            el.classList.add("removing");

            setTimeout(() => el.remove(), 300);

        }



        function resume() {

            if (dismissed) return;

            started = Date.now();

            progress.style.animationPlayState = "running";

            timer = setTimeout(dismiss, remaining);

        }



        function pause() {

            if (dismissed) return;

            clearTimeout(timer);

            remaining = Math.max(0, remaining - (Date.now() - started));

            progress.style.animationPlayState = "paused";

        }



        close.addEventListener("click", dismiss);

        el.addEventListener("mouseenter", pause);

        el.addEventListener("mouseleave", resume);



        resume();

    }







    /* =========================================



       CONFIGURATION



    ========================================= */







    const $ = (id) => document.getElementById(id);







    const max = 12;



    const min = 1;







    const base = Number(root.dataset.basePrice) || 0;



    const currency = root.dataset.currency || "USD";







    let travelers = Array.from({ length: 5 }, () => ({



        first: "",



        last: "",



        dob: "",



        nationality: "",



        email: ""



    }));







    // Restore a previously validated draft after login or signup.

    const savedDraftElement = document.getElementById("kd-saved-booking-draft");

    let savedDraft = null;

    if (savedDraftElement) {

        try {

            savedDraft = JSON.parse(savedDraftElement.textContent);

        } catch (error) {

            console.warn("Could not read saved booking draft", error);

        }

    }

    if (savedDraft && Array.isArray(savedDraft.travelers) &&

        savedDraft.travelers.length >= min && savedDraft.travelers.length <= max) {

        travelers = savedDraft.travelers.map(person => ({

            first: String(person.first || person.first_name || ""),

            last: String(person.last || person.last_name || ""),

            dob: String(person.dob || person.date_of_birth || ""),

            nationality: String(person.nationality || ""),

            email: String(person.email || "")

        }));

    }



    let active = 0;







    const fields = [



        ...root.querySelectorAll("[data-field]")



    ];







    const money = (amount) => {



        return new Intl.NumberFormat("en-US", {



            style: "currency",



            currency: currency,



            maximumFractionDigits: 0



        }).format(amount);



    };







    let appliedCoupon = null;



    const couponInput = $("kd-coupon-input");

    const couponButton = $("kd-apply-coupon");

    const couponMessage = $("kd-coupon-message");

    const couponSpinner = $("kd-coupon-spinner");

    const couponButtonText = $("kd-coupon-button-text");



    function getCouponTotals() {

        const subtotal = base * travelers.length;

        const percentage = appliedCoupon

            ? Number(appliedCoupon.discount_percentage)

            : 0;



        const discount = Math.round(subtotal * percentage) / 100;



        return {

            subtotal,

            discount,

            final: Math.max(0, subtotal - discount)

        };

    }



    function updateCouponSummary() {
        const discountRow = $("kd-coupon-discount");
        const finalRow = $("kd-coupon-final");
        const totalElement = $("kd-total");

        const totals = getCouponTotals();

        // Always show the total, even without a coupon.
        if (totalElement) {
            totalElement.textContent = money(totals.final);
        }

        if (!appliedCoupon) {
            if (discountRow) discountRow.hidden = true;
            if (finalRow) finalRow.hidden = true;
            return;
        }

        $("kd-coupon-percent").textContent =
            appliedCoupon.discount_percentage;

        $("kd-coupon-saving").textContent =
            "− " + money(totals.discount);

        if (discountRow) discountRow.hidden = false;

        // No need for a duplicate final price.
        if (finalRow) finalRow.hidden = true;
    }



    function clearCoupon() {

        appliedCoupon = null;

        couponMessage.textContent = "";

        couponMessage.className = "";

        updateCouponSummary();

    }



    let couponRequestId = 0;

    couponInput?.addEventListener("input", () => {
        couponRequestId++;

        clearCoupon();

    });



    couponButton?.addEventListener("click", async () => {

        const code = couponInput.value.trim().toUpperCase();



        if (!code) {

            couponMessage.textContent = "Please enter a coupon code.";

            couponMessage.className = "error";

            return;

        }



        const requestId = ++couponRequestId;
        const loadingStarted = performance.now();
        const minimumLoadingTime = 2000;
        couponButton.disabled = true;
        couponButton.classList.add("is-loading");
        couponSpinner.hidden = false;
        couponButtonText.hidden = true;

        couponMessage.textContent = "";

        clearCoupon();

        



        try {

            const csrfToken = document.querySelector(

                "#kd-csrf-token input[name='csrfmiddlewaretoken']"

            )?.value;



            const response = await fetch(root.dataset.couponUrl, {

                method: "POST",

                credentials: "same-origin",

                headers: {

                    "Content-Type": "application/json",

                    "X-CSRFToken": csrfToken,

                    "X-Requested-With": "XMLHttpRequest"

                },

                body: JSON.stringify({ code })

            });



            const data = await response.json();

            // Wait until at least 2 seconds have passed
            const elapsed = performance.now() - loadingStarted;
            const remaining = Math.max(0, minimumLoadingTime - elapsed);

            if (remaining > 0) {
                await new Promise(resolve => setTimeout(resolve, remaining));
            }

            if (requestId !== couponRequestId) return;



            if (!response.ok || !data.valid) {

                throw new Error(data.message || "Unable to validate coupon.");

            }



            appliedCoupon = {

                code: data.code,

                discount_percentage: Number(data.discount_percentage)

            };



            couponInput.value = data.code;

            couponMessage.textContent = data.message;

            couponMessage.className = "success";



            updateCouponSummary();



        } catch (error) {

            couponMessage.textContent = error.message;

            couponMessage.className = "error";

        } finally {
            couponButton.disabled = false;
            couponButton.classList.remove("is-loading");
            couponSpinner.hidden = true;
            couponButtonText.hidden = false;
            couponButtonText.textContent = "Apply";
        }

    });
















    const esc = (value) => {



        return String(value).replace(/[&<>"']/g, (char) => ({



            "&": "&amp;",



            "<": "&lt;",



            ">": "&gt;",



            '"': "&quot;",



            "'": "&#39;"



        }[char]));



    };











    /* =========================================



       BOOKING PROGRESS TRACKER



    ========================================= */







    const bookingSteps = [



        ...root.querySelectorAll(



            "#kd-booking-steps [data-step]"



        )



    ];







    const bookingSections = [



        $("traveler-section"),



        $("rooms-section"),



        $("contact-section")



    ];







    const reviewModal = $("kd-review-modal");







    function setBookingStep(step) {







        bookingSteps.forEach((item) => {







            const itemStep = Number(item.dataset.step);







            item.classList.toggle(



                "current",



                itemStep === step



            );







            item.classList.toggle(



                "completed",



                itemStep < step



            );







            if (itemStep === step) {



                item.setAttribute("aria-current", "step");



            } else {



                item.removeAttribute("aria-current");



            }







        });







    }







    function updateBookingProgress() {







        if (reviewModal && !reviewModal.hidden) {



            setBookingStep(4);



            return;



        }







        const stepsBar = $("kd-booking-steps");







        const navbarOffset = 90;







        const offset = stepsBar



            ? navbarOffset + stepsBar.offsetHeight + 20



            : 220;







        let activeStep = 1;







        bookingSections.forEach((section, index) => {







            if (!section) return;







            const sectionTop =



                section.getBoundingClientRect().top;







            if (sectionTop <= offset) {



                activeStep = index + 1;



            }







        });







        setBookingStep(activeStep);







    }







    window.addEventListener(



        "scroll",



        updateBookingProgress,



        { passive: true }



    );







    window.addEventListener(



        "resize",



        updateBookingProgress



    );







    if (reviewModal) {







        const progressObserver = new MutationObserver(



            updateBookingProgress



        );







        progressObserver.observe(reviewModal, {



            attributes: true,



            attributeFilter: ["hidden"]



        });







    }











    /* =========================================



       TRAVELER VALIDATION



    ========================================= */







    function complete(traveler, index) {







        const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;







        return Boolean(



            traveler.first.trim() &&



            traveler.last.trim() &&



            traveler.dob &&



            traveler.nationality.trim() &&



            (



                index !== 0 ||



                validEmail.test(traveler.email.trim())



            )



        );







    }











    /* =========================================



       SAVE ACTIVE TRAVELER



    ========================================= */







    function save() {







        fields.forEach((field) => {







            travelers[active][field.dataset.field] =



                field.value;







        });







    }











    /* =========================================



       RENDER TRAVELER FORM



    ========================================= */







    function render() {







        const count = travelers.length;







        $("kd-count").textContent = count;







        $("kd-summary-count").textContent =



            `${count} ${count === 1 ? "person" : "people"}`;







        $("kd-completed").textContent =



            `${travelers.filter(complete).length} of ${count} complete`;











        /* TRAVELER TABS */







        $("kd-traveler-tabs").innerHTML = travelers



            .map((traveler, index) => {







                const selected = index === active;







                const completed = complete(



                    traveler,



                    index



                );







                const label = index === 0



                    ? "Lead traveler"



                    : `Traveler ${index + 1}`;







                return `



                    <button



                        type="button"



                        role="tab"



                        aria-selected="${selected}"



                        data-tab="${index}"



                        class="${selected ? "selected" : ""}"



                    >



                        ${



                            completed



                                ? '<span class="kd-tick">✓</span>'



                                : ""



                        }







                        ${label}



                    </button>



                `;







            })



            .join("");











        /* FORM HEADING */







        $("kd-form-heading").textContent =



            active === 0



                ? "Lead traveler"



                : `Traveler ${active + 1}`;







        $("kd-lead-pill").hidden = active !== 0;











        /* RESTORE FIELD VALUES */







        fields.forEach((field) => {







            field.value =



                travelers[active][field.dataset.field] || "";







            if (field.dataset.field === "email") {







                field.closest("label").hidden =



                    active !== 0;







                field.required = active === 0;







            }







        });











        /* NAVIGATION BUTTONS */







        $("kd-prev").disabled = active === 0;







        $("kd-next").textContent =



            active === count - 1



                ? "Back to lead traveler ↺"



                : "Next traveler →";











        /* TRAVELER COUNTER */







        $("kd-minus").disabled = count <= min;



        $("kd-plus").disabled = count >= max;











       /* PRICE SUMMARY */

        $("kd-price").textContent = base
            ? `${money(base)} × ${count}`
            : "Pending";

        updateCouponSummary();

    }











    /* =========================================



       SWITCH TRAVELERS



    ========================================= */







    function go(index) {







        save();







        active = index;







        render();







    }











    /* =========================================



       LIVE FIELD UPDATES



    ========================================= */







    root.addEventListener("input", (event) => {







        if (!event.target.matches("[data-field]")) {



            return;



        }







        save();







        $("kd-completed").textContent =



            `${travelers.filter(complete).length} of ${travelers.length} complete`;







        const tab = $("kd-traveler-tabs").querySelector(



            `[data-tab="${active}"]`



        );







        if (!tab) return;







        const completed = complete(



            travelers[active],



            active



        );







        const existingTick = tab.querySelector(



            ".kd-tick"



        );







        if (completed && !existingTick) {







            tab.insertAdjacentHTML(



                "afterbegin",



                '<span class="kd-tick">✓</span>'



            );







        }







        if (!completed && existingTick) {







            existingTick.remove();







        }







    });











    /* =========================================



       TRAVELER TAB CLICK



    ========================================= */







    $("kd-traveler-tabs").addEventListener(



        "click",



        (event) => {







            const tab = event.target.closest(



                "[data-tab]"



            );







            if (!tab) return;







            go(Number(tab.dataset.tab));







        }



    );











    /* =========================================



       ADD TRAVELER



    ========================================= */







    $("kd-plus").addEventListener("click", () => {







        if (travelers.length >= max) return;







        save();







        travelers.push({



            first: "",



            last: "",



            dob: "",



            nationality: "",



            email: ""



        });







        render();







    });











    /* =========================================



       REMOVE TRAVELER



    ========================================= */







    $("kd-minus").addEventListener("click", () => {







        if (travelers.length <= min) return;







        save();







        travelers.pop();







        active = Math.min(



            active,



            travelers.length - 1



        );







        render();







    });











    /* =========================================



       PREVIOUS / NEXT TRAVELER



    ========================================= */







    $("kd-next").addEventListener("click", () => {







        go((active + 1) % travelers.length);







    });







    $("kd-prev").addEventListener("click", () => {







        if (active > 0) {



            go(active - 1);



        }







    });











    /* =========================================



       ROOM PREFERENCES



    ========================================= */







    root.querySelectorAll(



        '[name="room_preference"]'



    ).forEach((input) => {







        input.addEventListener("change", () => {







            const selected = root.querySelector(



                '[name="room_preference"]:checked'



            );







            if (!selected) return;







            const value = selected.value;







            $("kd-room-notes-wrap").hidden =



                value !== "custom";







            const roomLabels = {



                recommended: "Best available",



                together: "Nearby rooms",



                custom: "Custom request"



            };







            $("kd-summary-room").textContent =



                roomLabels[value] || "Best available";







        });







    });











    /* =========================================



       OPEN REVIEW MODAL



    ========================================= */







    $("kd-submit").addEventListener("click", () => {







        save();







        const problems = [];











        /* VALIDATE ALL TRAVELERS */







        travelers.forEach((traveler, index) => {







            if (!complete(traveler, index)) {







                const name = index === 0



                    ? "lead traveler"



                    : `traveler ${index + 1}`;







                problems.push(



                    `Complete ${name} details.`



                );







            }







        });











        /* VALIDATE PHONE */







       if (!departureInput || !departureInput.value || departureInput.value < departureInput.min) {

            problems.push("Choose a future departure date.");

        }

        if (!$("kd-phone").value.trim()) {







            problems.push(



                "Add a lead contact phone number."



            );







        }



















        /* VALIDATE TERMS */







        if (!$("kd-terms").checked) {







            problems.push(



                "Accept the applicable terms and privacy policy."



            );







        }











        /* DISPLAY VALIDATION ERRORS */







        const errors = $("kd-errors");



        // Hide the old inline error box

        errors.hidden = true;

        errors.innerHTML = "";



        if (problems.length > 0) {



            showToast(

                "Please check:\n\n" + problems.map(

                    (problem) => "• " + problem

                ).join("\n"),

                "error"

            );



            return;

        }











        /* GENERATE REVIEW LIST */







        const travelerList = travelers



            .map((traveler, index) => {







                const label = index === 0



                    ? "Lead traveler"



                    : `Traveler ${index + 1}`;







                return `



                    <li>



                        <strong>



                            ${esc(traveler.first)}



                            ${esc(traveler.last)}



                        </strong>







                        <span>${label}</span>



                    </li>



                `;







            })



            .join("");











        /* REVIEW CONTENT */







        $("kd-review-content").innerHTML = `



            <p>



                <strong>



                    ${travelers.length} travelers



                </strong>



                in one booking request.



            </p>







            <ul class="kd-review-list">



                ${travelerList}



            </ul>







            <p>



                <strong>Departure date:</strong> ${esc(departureInput.value)}

            </p>

            <p>

                <strong>Room preference:</strong>



                ${esc($("kd-summary-room").textContent)}



            </p>







            <p>



                <strong>Estimated base tour amount:</strong>



                ${esc($("kd-total").textContent)}



            </p>

                ${appliedCoupon ? `
                    <p><strong>Coupon:</strong> ${esc(appliedCoupon.code)} (${appliedCoupon.discount_percentage}% off)</p>
                    <p><strong>Discount:</strong> ${esc(money(getCouponTotals().discount))}</p>
                    <p><strong>Discounted group total:</strong> ${esc(money(getCouponTotals().final))}</p>
                ` : ""}



        `;











        /* SHOW MODAL */







        reviewModal.hidden = false;







        document.body.classList.add(



            "kd-modal-open"



        );







        setBookingStep(4);







    });











    /* =========================================



       CLOSE REVIEW MODAL



    ========================================= */







    function closeReviewModal() {







        reviewModal.hidden = true;







        document.body.classList.remove(



            "kd-modal-open"



        );







        updateBookingProgress();







    }







    root.querySelectorAll("[data-close]").forEach(



        (element) => {







            element.addEventListener(



                "click",



                closeReviewModal



            );







        }



    );











    /* =========================================



       ESCAPE KEY



    ========================================= */







    document.addEventListener(



        "keydown",



        (event) => {







            if (



                event.key === "Escape" &&



                !reviewModal.hidden



            ) {



                closeReviewModal();



            }







        }



    );



















    /* =========================================



       SAVE GROUP BOOKING TO DJANGO



    ========================================= */







    const paymentButton = $("kd-continue-payment");







    paymentButton.addEventListener("click", async () => {







        if (paymentButton.disabled) return;







        // Save the currently displayed traveler.



        save();







        // The review modal must already be open.



        if (reviewModal.hidden) return;







        const csrfToken = document.querySelector(



            "#kd-csrf-token input[name='csrfmiddlewaretoken']"



        )?.value;







        if (!csrfToken) {



            showToast("Security token missing. Please refresh the page.", "error");



            return;



        }







        const selectedRoom = root.querySelector(



            '[name="room_preference"]:checked'



        );









        const departureInput = document.getElementById("kd-departure-date");



            if (!departureInput || !departureInput.value) {

                showToast("Please select a departure date.", "error");

                return;

            }



            const today = new Date();

            today.setHours(0, 0, 0, 0);



            const selectedDate = new Date(departureInput.value + "T00:00:00");



            if (Number.isNaN(selectedDate.getTime()) || selectedDate <= today) {

                showToast("Please select a future departure date.", "error");

                return;

            }









        const bookingData = {
            coupon_code: appliedCoupon?.code || "",



            tour_id: root.dataset.tourId,

            departure_date: departureInput.value.trim(),







            travelers: travelers.map((traveler) => ({



                first: traveler.first,



                last: traveler.last,



                dob: traveler.dob,



                nationality: traveler.nationality,



                email: traveler.email



            })),







            room_preference: selectedRoom



                ? selectedRoom.value



                : "recommended",







            room_notes: $("kd-room-notes").value.trim(),







            contact_phone: $("kd-phone").value.trim(),







            country_of_residence: $("kd-country").value.trim(),







            special_requests: $("kd-special").value.trim(),







            terms_accepted: $("kd-terms").checked



        };







        const originalContent = paymentButton.innerHTML;







        paymentButton.disabled = true;



        paymentButton.textContent = "Saving your booking...";







        try {



            const response = await fetch(



                root.dataset.bookingUrl,



                {



                    method: "POST",



                    headers: {



                        "Content-Type": "application/json",



                        "X-CSRFToken": csrfToken



                    },



                    credentials: "same-origin",



                    body: JSON.stringify(bookingData)



                }



            );







            const result = await response.json();







            if (result.login_required && result.login_url) {

                // Django already saved the validated travelers and preferences.

                window.location.assign(result.login_url);

                return;

            }



            if (!response.ok || !result.success) {



                throw new Error(



                    result.error || "Unable to save booking."



                );



            }









              paymentButton.textContent = 'Opening secure payment...';



            const paymentResponse = await fetch(result.payment_start_url, {



                method: 'POST',



                headers: { 'X-CSRFToken': csrfToken },



                credentials: 'same-origin'



            });



            const payment = await paymentResponse.json();



            if (!paymentResponse.ok || !payment.success) {



                throw new Error(payment.error || 'Unable to start payment.');



            }



            const proceed = window.confirm(



                `Booking total: USD ${payment.amount_usd}\n` +



                `Thawani will charge: OMR ${payment.amount_omr}\n\n` +



                'Your card issuer may apply conversion fees. Continue to Thawani?'



            );



            if (!proceed) {



                paymentButton.disabled = false;



                paymentButton.innerHTML = originalContent;



                return;



            }



            window.open(payment.checkout_url, "\_blank");







        } catch (error) {



            showToast(error.message, "error");







            paymentButton.disabled = false;



            paymentButton.innerHTML = originalContent;



        }



    });























    /* =========================================



       INITIALIZE



    ========================================= */







    const departureInput = $("kd-departure-date");

    if (departureInput) {

        const tomorrow = new Date();

        tomorrow.setDate(tomorrow.getDate() + 1);

        const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

        departureInput.min = localDate(tomorrow);

    }

    if (savedDraft) {

        if (departureInput && savedDraft.departure_date) departureInput.value = savedDraft.departure_date;

        const room = root.querySelector(

            `[name="room_preference"][value="${savedDraft.room_preference || 'recommended'}"]`

        );

        if (room) {

            room.checked = true;

            room.dispatchEvent(new Event("change", { bubbles: true }));

        }

        $("kd-room-notes").value = savedDraft.room_notes || "";

        $("kd-phone").value = savedDraft.contact_phone || "";

        $("kd-country").value = savedDraft.country_of_residence || "";

        $("kd-special").value = savedDraft.special_requests || "";

        $("kd-terms").checked = savedDraft.terms_accepted === true;
        if (couponInput && savedDraft.coupon_code) {
            couponInput.value = savedDraft.coupon_code;
            couponMessage.textContent = "Apply your coupon again to confirm the discount.";
        }

    }



    render();



    updateBookingProgress();







})();
