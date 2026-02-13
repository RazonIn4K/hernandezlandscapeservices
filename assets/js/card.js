        let currentLang = 'en';
        
        function toggleLang() {
            currentLang = currentLang === 'en' ? 'es' : 'en';
            document.getElementById('langLabel').textContent = currentLang === 'en' ? 'ES' : 'EN';
            
            document.querySelectorAll('[data-' + currentLang + ']').forEach(el => {
                el.textContent = el.getAttribute('data-' + currentLang);
            });
        }

        function saveContact() {
            // Simple vCard generation
            const vcard = "BEGIN:VCARD\nVERSION:3.0\nFN:Hernandez Landscape\nTEL;TYPE=CELL:8155011478\nURL:https://hernandezlandscapeservices.com\nEND:VCARD";
            const blob = new Blob([vcard], { type: "text/vcard" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "HernandezLandscape.vcf";
            a.click();
        }
