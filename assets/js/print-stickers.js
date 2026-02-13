            // Using a reliable public API for the QR code for instant demonstration
            // Pointing to the new card.html page
            const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://hernandezlandscapeservices.com/card.html&color=15803d";
            
            const sheet = document.querySelector('.sheet');
            if (sheet) {
                let html = '';
                for(let i=0; i<30; i++) {
                    html += `
                    <div class="sticker">
                        <div class="sticker-content">
                            <img src="${qrUrl}" class="qr-code" alt="QR">
                            <div class="info">
                                <div class="company">HERNANDEZ<br>LANDSCAPE</div>
                                <div class="cta">Scan for Info/Est</div>
                                <div class="phone">815-501-1478</div>
                            </div>
                        </div>
                    </div>
                    `;
                }
                sheet.innerHTML = html;
            }
