        const slider = document.getElementById('mainSlider');
        const handle = document.getElementById('sliderHandle');
        if (slider && handle) {
            let isSliding = false;
            const afterImage = slider.querySelector('.after-image');

            const updateSlider = (percentage) => {
                if (!afterImage) return;
                const constrained = Math.max(0, Math.min(100, percentage));
                afterImage.style.clipPath = `polygon(${constrained}% 0, 100% 0, 100% 100%, ${constrained}% 100%)`;
                handle.style.left = `${constrained}%`;
            };

            const onMove = (clientX) => {
                const rect = slider.getBoundingClientRect();
                const percentage = ((clientX - rect.left) / rect.width) * 100;
                updateSlider(percentage);
            };

            handle.addEventListener('mousedown', () => isSliding = true);
            window.addEventListener('mouseup', () => isSliding = false);
            window.addEventListener('mousemove', (e) => { if (isSliding) onMove(e.clientX); });

            handle.addEventListener('touchstart', () => isSliding = true);
            window.addEventListener('touchend', () => isSliding = false);
            window.addEventListener('touchmove', (e) => { 
                if (isSliding) onMove(e.touches[0].clientX); 
            });

            // Initial position
            updateSlider(50);
        }
