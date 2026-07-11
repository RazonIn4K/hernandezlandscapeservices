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
        sliderHandle.setAttribute('aria-valuenow', String(Math.round(constrained)));
        sliderHandle.setAttribute('aria-valuetext', `Comparison divider at ${Math.round(constrained)}%`);
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
    }, { passive: true });
    window.addEventListener('touchend', () => {
        isSliding = false;
    }, { passive: true });
    window.addEventListener('touchmove', (event) => {
        if (isSliding) {
            onMove(event.touches[0].clientX);
        }
    }, { passive: true });

    sliderHandle.addEventListener('keydown', (event) => {
        const currentValue = Number(sliderHandle.getAttribute('aria-valuenow')) || 50;
        const keyActions = {
            ArrowLeft: currentValue - 5,
            ArrowDown: currentValue - 5,
            ArrowRight: currentValue + 5,
            ArrowUp: currentValue + 5,
            PageDown: currentValue - 10,
            PageUp: currentValue + 10,
            Home: 0,
            End: 100
        };

        if (!(event.key in keyActions)) {
            return;
        }

        event.preventDefault();
        updateSlider(keyActions[event.key]);
    });

    updateSlider(50);
})();
