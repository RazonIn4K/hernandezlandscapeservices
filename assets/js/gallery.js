(function () {
    const mainSlider = document.getElementById('mainSlider');
    const sliderHandle = document.getElementById('sliderHandle');

    if (!mainSlider || !sliderHandle) {
        return;
    }

    let isSliding = false;
    const afterImage = mainSlider.querySelector('.after-image');

    const updateSlider = (percentage) => {
        if (!afterImage) {
            return;
        }
        const constrained = Math.max(0, Math.min(100, percentage));
        afterImage.style.clipPath = `polygon(${constrained}% 0, 100% 0, 100% 100%, ${constrained}% 100%)`;
        sliderHandle.style.left = `${constrained}%`;
    };

    const onMove = (clientX) => {
        const rect = mainSlider.getBoundingClientRect();
        const percentage = ((clientX - rect.left) / rect.width) * 100;
        updateSlider(percentage);
    };

    sliderHandle.addEventListener('mousedown', () => {
        isSliding = true;
    });
    window.addEventListener('mouseup', () => {
        isSliding = false;
    });
    window.addEventListener('mousemove', (event) => {
        if (isSliding) {
            onMove(event.clientX);
        }
    });

    sliderHandle.addEventListener('touchstart', () => {
        isSliding = true;
    });
    window.addEventListener('touchend', () => {
        isSliding = false;
    });
    window.addEventListener('touchmove', (event) => {
        if (isSliding) {
            onMove(event.touches[0].clientX);
        }
    });

    updateSlider(50);
})();
