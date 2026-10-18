document.addEventListener("DOMContentLoaded", function () {
    var cardContent = [
        "Content for Image 1",
        "Content for Image 2",
        "Content for Image 3",
        "Content for Image 4",
        "Content for Image 5",
        "Content for Image 6",
    ];

    var cardDescriptions = [
        "Description for Image 1",
        "Description for Image 2",
        "Description for Image 3",
        "Description for Image 4",
        "Description for Image 5",
        "Description for Image 6",
    ];

    var cardImages = [
        "images/109d03b9-b77e-4985-becf-ee8c025feb3c.png",
        "images/1219297-ffffff.svg",
        "images/1219297.svg",
        "images/90a9e0f0-df53-4bf5-9b13-5a986ec2b3ab.png",
        "images/image-removebg-preview.png",
        "images/nature.jpg"
    ];

    var contentContainer = document.querySelector('.card__content__offer__child');
    var imageContainer = document.querySelector('.cards__offer');
    var currentIndex = 0;

    var dots = document.querySelectorAll('.dot');
    var totalSlides = cardContent.length;

    function updateProgressIndicator() {
        dots.forEach((dot, index) => {
            if (index <= currentIndex) {
                dot.classList.add('active');
                dot.style.backgroundColor = 'black'; 
            } else {
                dot.classList.remove('active');
                dot.style.backgroundColor = ''; 
            }

            if (index === 0) {
                dot.innerHTML = `<span class="dot-number">0${currentIndex + 1}</span>`;
            } else if (index === totalSlides - 1) {
                dot.innerHTML = '<span class="dot-number">06</span>';
            } else {
                dot.innerHTML = '';
            }
        });
    }

    function updateContent() {
        contentContainer.innerHTML = `
            <h1 data-aos="fade-right">${cardContent[currentIndex]}</h1>
            <p data-aos="fade-left">${cardDescriptions[currentIndex]}</p>
            <div class="buttons-container" data-aos="fade-up">
                <button class="description-button">Read More</button>
            </div>
        `;

        imageContainer.style.transition = 'background-image 0.5s ease-in-out';
        imageContainer.style.backgroundImage = 'url("' + cardImages[currentIndex] + '")';
        imageContainer.style.backgroundSize = 'cover';
        imageContainer.style.backgroundPosition = 'center';
        imageContainer.style.backgroundRepeat = 'no-repeat';
        imageContainer.style.height = '500px';

        setTimeout(function () {
            imageContainer.style.transition = '';
        }, 500);

        updateProgressIndicator();
    }

    function handleArrowClick(direction) {
        currentIndex = (currentIndex + direction + cardContent.length) % cardContent.length;
        updateContent();
    }

    document.querySelector('.left-arrow').addEventListener('click', function () {
        handleArrowClick(-1);
    });

    document.querySelector('.right-arrow').addEventListener('click', function () {
        handleArrowClick(1);
    });

    updateContent();
});