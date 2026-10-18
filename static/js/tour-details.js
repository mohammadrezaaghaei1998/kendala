
document.addEventListener("DOMContentLoaded", function () {
    const links = document.querySelectorAll(
        "#accordionIncluded .panel-title a, " +
        "#accordionNotIncluded .panel-title a"
    );

    links.forEach(function (link) {
        const targetId = link.getAttribute("href");
        const panel = document.querySelector(targetId);
        const arrow = link.querySelector(
            ".fa-arrow-down, .fa-arrow-up"
        );

        if (!panel || !arrow) return;

        function updateArrow() {
            const isOpen =
                panel.classList.contains("show") ||
                panel.classList.contains("in");

            arrow.classList.toggle("fa-arrow-up", isOpen);
            arrow.classList.toggle("fa-arrow-down", !isOpen);
        }

        panel.addEventListener("shown.bs.collapse", updateArrow);
        panel.addEventListener("hidden.bs.collapse", updateArrow);

        updateArrow();
    });
});






 $(document).ready(function() {
    $('.panel-heading a').on('click', function () {
        var icon = $(this).find('i'); 
        var targetPanel = $($(this).attr('href')); 
        
        if (targetPanel.hasClass('show')) {
            icon.removeClass('fa-arrow-up').addClass('fa-arrow-down');
        } else {
            icon.removeClass('fa-arrow-down').addClass('fa-arrow-up');
        }
    });
});












  document.addEventListener("DOMContentLoaded", function() {
    const cards = document.querySelectorAll("#reviews-container .card");
    let visibleCount = 2;  
    const increment = 5;    

    function updateCards() {
        cards.forEach((card, index) => {
            card.style.display = index < visibleCount ? "block" : "none";
        });

        document.getElementById("show-less").style.display = visibleCount > 2 ? "inline-block" : "none";
        document.getElementById("show-more").style.display = visibleCount < cards.length ? "inline-block" : "none";
    }

    updateCards();

    document.getElementById("show-more").addEventListener("click", function() {
        visibleCount += increment;
        updateCards();
    });

    document.getElementById("show-less").addEventListener("click", function() {
        visibleCount = 2;
        updateCards();
    });
});