/* ==========================================================
   ROYAL SUITS — CARROSSEL DE LOOKS (lookbook.js)
   Carrossel de looks embutido em ternos.html e vestidos.html.
   Os dados de cada peça vêm dos data-attributes do <article>.
========================================================== */

(function () {
    "use strict";

    var root = document.getElementById("rs-lookbook");
    if (!root) return;

    var viewport = root.querySelector(".lb-viewport");
    var track = root.querySelector(".lb-track");
    var cards = Array.prototype.slice.call(root.querySelectorAll(".lb-look"));
    var dots = root.querySelector(".lb-dots");

    var titleEl = root.querySelector(".lb-info h3");
    var descriptionEl = root.querySelector(".lb-description");
    var priceEl = root.querySelector(".lb-price");
    var currentLabel = root.querySelector(".lb-counter strong");
    var totalLabel = root.querySelector(".lb-counter span:last-child");
    var swatchesBox = root.querySelector(".lb-swatches");

    var modal = root.querySelector(".lb-modal-backdrop");
    var modalImage = root.querySelector(".lb-modal-visual img");

    var active = 0;
    var startX = 0;
    var deltaX = 0;
    var dragging = false;
    var autoplay = null;

    var selectedSize = "";
    var selectedColor = "";

    function pad(n) { return String(n + 1).padStart(2, "0"); }

    function notify(message) {
        if (typeof window.rsToast === "function") {
            window.rsToast(message);
            return;
        }
        var toast = root.querySelector(".lb-toast");
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("lb-show");
        setTimeout(function () { toast.classList.remove("lb-show"); }, 2400);
    }

    /* ---------- DADOS DE CADA LOOK ---------- */

    function parseColors(raw) {
        if (!raw) return [];
        return raw.split(",").map(function (item) {
            var parts = item.split(":");
            return [parts[0].trim(), (parts[1] || "#d4af37").trim()];
        });
    }

    function dataFor(index) {
        var card = cards[index];
        var d = card.dataset;
        return {
            category: d.category || "ROYAL SUITS / LOOK",
            model: d.model || "Royal Suits",
            material: d.material || "Tecido premium",
            composition: d.composition || "Detalhes com a equipe Royal Suits.",
            fit: d.fit || "Modelagem clássica",
            features: d.features || "Consulte a equipe Royal Suits para mais detalhes.",
            care: d.care || "Siga as instruções da etiqueta.",
            sizes: (d.sizes || "PP,P,M,G,GG").split(",").map(function (s) { return s.trim(); }),
            colors: parseColors(d.colors)
        };
    }

    /* ---------- DOTS ---------- */

    if (totalLabel) totalLabel.textContent = pad(cards.length - 1);

    var dotButtons = cards.map(function (card, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "lb-dot";
        dot.setAttribute("aria-label", "Ir para look " + (i + 1));
        dot.addEventListener("click", function () { go(i); });
        dots.appendChild(dot);

        card.addEventListener("click", function () { go(i); });
        card.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                go(i);
            }
        });

        return dot;
    });

    /* ---------- NAVEGAÇÃO ---------- */

    function go(index) {
        active = (index + cards.length) % cards.length;

        var card = cards[active];
        var left = card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;

        track.style.transform = "translate3d(" + (-left) + "px, 0, 0)";

        cards.forEach(function (c, i) {
            c.classList.toggle("lb-active", i === active);
        });

        dotButtons.forEach(function (d, i) {
            d.classList.toggle("lb-active", i === active);
        });

        var data = dataFor(active);

        if (titleEl) titleEl.textContent = card.dataset.title || "";
        if (descriptionEl) descriptionEl.textContent = card.dataset.description || "";
        if (priceEl) priceEl.textContent = card.dataset.price || "Sob consulta";
        if (currentLabel) currentLabel.textContent = pad(active);

        renderSwatches(data.colors);
    }

    function renderSwatches(colors) {
        if (!swatchesBox) return;
        swatchesBox.innerHTML = "";
        colors.forEach(function (pair, i) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "lb-swatch";
            btn.style.background = pair[1];
            btn.setAttribute("aria-label", pair[0]);
            btn.setAttribute("aria-pressed", i === 0 ? "true" : "false");
            btn.addEventListener("click", function () {
                swatchesBox.querySelectorAll(".lb-swatch").forEach(function (b) {
                    b.setAttribute("aria-pressed", "false");
                });
                btn.setAttribute("aria-pressed", "true");
            });
            swatchesBox.appendChild(btn);
        });
    }

    function next() { go(active + 1); }
    function prev() { go(active - 1); }

    root.querySelector(".lb-next").addEventListener("click", next);
    root.querySelector(".lb-prev").addEventListener("click", prev);

    /* ---------- ARRASTAR ---------- */

    viewport.addEventListener("pointerdown", function (e) {
        startX = e.clientX;
        deltaX = 0;
        dragging = true;
        viewport.classList.add("lb-dragging");
        stopAuto();
        if (viewport.setPointerCapture) viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener("pointermove", function (e) {
        if (dragging) deltaX = e.clientX - startX;
    });

    function endDrag() {
        if (!dragging) return;
        dragging = false;
        viewport.classList.remove("lb-dragging");
        if (Math.abs(deltaX) > 45) {
            if (deltaX < 0) next(); else prev();
        }
        startAuto();
    }

    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    document.addEventListener("keydown", function (e) {
        if (modal.classList.contains("lb-open")) return;
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
    });

    /* ---------- MODAL DO PRODUTO ---------- */

    function openProduct() {
        var card = cards[active];
        var data = dataFor(active);
        var img = card.querySelector("img");

        modalImage.src = img.src;
        modalImage.alt = img.alt;

        var preview = root.querySelector(".lb-tryon-preview img");
        preview.src = img.src;
        preview.alt = "Prévia ilustrativa de " + (card.dataset.title || "look");

        root.querySelector(".lb-recommend-panel").classList.remove("lb-open");
        root.querySelector(".lb-recommend-result").classList.remove("lb-show");
        root.querySelector(".lb-usual-size").value = "";
        root.querySelector(".lb-fit-preference").value = "regular";

        root.querySelector(".lb-modal-kicker").textContent = data.category;
        root.querySelector(".lb-modal-content h2").textContent = card.dataset.title || "";
        root.querySelector(".lb-modal-price").textContent = card.dataset.price || "Sob consulta";
        root.querySelector(".lb-modal-description").textContent = card.dataset.description || "";

        var fields = [
            ["Modelo", data.model],
            ["Material", data.material],
            ["Composição", data.composition],
            ["Caimento", data.fit],
            ["Características", data.features],
            ["Cuidados", data.care]
        ];

        root.querySelector(".lb-spec-grid").innerHTML = fields.map(function (f) {
            return '<div class="lb-spec"><small>' + f[0] + '</small><span>' + f[1] + '</span></div>';
        }).join("");

        selectedSize = "";
        selectedColor = "";

        /* tamanhos */
        var sizesBox = root.querySelector(".lb-size-options");
        sizesBox.innerHTML = data.sizes.map(function (size) {
            return '<button class="lb-size-option" type="button">' + size + '</button>';
        }).join("");

        sizesBox.querySelectorAll(".lb-size-option").forEach(function (btn) {
            btn.addEventListener("click", function () {
                sizesBox.querySelectorAll(".lb-size-option").forEach(function (b) {
                    b.classList.remove("lb-selected");
                });
                btn.classList.add("lb-selected");
                selectedSize = btn.textContent.trim();
            });
        });

        /* cores */
        var colorsBox = root.querySelector(".lb-color-options");
        colorsBox.innerHTML = data.colors.map(function (pair) {
            return '<button class="lb-color-option" type="button" title="' + pair[0] +
                '" aria-label="' + pair[0] + '" style="background:' + pair[1] + '"></button>';
        }).join("");

        colorsBox.querySelectorAll(".lb-color-option").forEach(function (btn) {
            btn.addEventListener("click", function () {
                colorsBox.querySelectorAll(".lb-color-option").forEach(function (b) {
                    b.classList.remove("lb-selected");
                });
                btn.classList.add("lb-selected");
                selectedColor = btn.title;
            });
        });

        root.querySelector(".lb-usual-size").innerHTML =
            '<option value="">Selecione</option>' +
            data.sizes.map(function (s) { return "<option>" + s + "</option>"; }).join("");

        modal.classList.add("lb-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        stopAuto();
    }

    function closeProduct() {
        modal.classList.remove("lb-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        startAuto();
    }

    root.querySelector(".lb-details").addEventListener("click", openProduct);
    root.querySelector(".lb-modal-close").addEventListener("click", closeProduct);

    modal.addEventListener("click", function (e) {
        if (e.target === modal) closeProduct();
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && modal.classList.contains("lb-open")) closeProduct();
    });

    /* ---------- RECOMENDADOR DE TAMANHO ---------- */

    root.querySelector(".lb-recommend-open").addEventListener("click", function () {
        var panel = root.querySelector(".lb-recommend-panel");
        panel.classList.toggle("lb-open");
        if (panel.classList.contains("lb-open")) {
            panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    });

    root.querySelector(".lb-recommend-submit").addEventListener("click", function () {
        var usual = root.querySelector(".lb-usual-size").value;
        var fit = root.querySelector(".lb-fit-preference").value;
        var data = dataFor(active);
        var result = root.querySelector(".lb-recommend-result");

        if (!usual) {
            notify("Selecione o tamanho que costuma usar.");
            return;
        }

        var usualOrder = ["PP", "P", "M", "G", "GG", "XG", "XGG"];
        var available = data.sizes;
        var suggested = usual;

        if (available.indexOf(suggested) === -1) {
            var target = usualOrder.indexOf(usual);
            suggested = available.reduce(function (best, size) {
                return Math.abs(usualOrder.indexOf(size) - target) <
                    Math.abs(usualOrder.indexOf(best) - target) ? size : best;
            }, available[0]);
        }

        var fitText =
            fit === "solto"
                ? "Você prefere um caimento mais soltinho. Se estiver entre dois tamanhos, confira as medidas do maior."
                : fit === "justo"
                    ? "Você prefere um caimento mais ajustado. Confira as medidas da peça para avaliar se o tamanho habitual atende."
                    : "Você prefere um caimento regular. Use a tabela de medidas para confirmar a escolha.";

        root.querySelector(".lb-result-size").textContent = suggested;
        root.querySelector(".lb-recommend-text").textContent =
            "Como você costuma usar " + usual + ", a sugestão inicial para esta peça é " +
            suggested + ". " + fitText;

        root.querySelector(".lb-preview-text").textContent =
            "Prévia ilustrativa de " + (cards[active].dataset.title || "look") +
            " — tamanho sugerido " + suggested +
            ". A imagem não simula precisamente o caimento no corpo.";

        root.querySelectorAll(".lb-size-option").forEach(function (btn) {
            var isMatch = btn.textContent.trim() === suggested;
            btn.classList.toggle("lb-selected", isMatch);
            if (isMatch) selectedSize = suggested;
        });

        result.classList.add("lb-show");
    });

    /* ---------- CONFIRMAR SELEÇÃO ---------- */

    root.querySelector(".lb-modal-action").addEventListener("click", function () {
        if (!selectedSize || !selectedColor) {
            notify("Selecione um tamanho e uma cor.");
            return;
        }

        var card = cards[active];
        var price = parseFloat(String(card.dataset.price || "").replace(/[^\d,]/g, "").replace(",", "."));
        var name = (card.dataset.title || "Look") + " — " + selectedSize + " / " + selectedColor;

        if (!isNaN(price) && price > 0) {
            var carrinho = [];
            try { carrinho = JSON.parse(localStorage.getItem("carrinho")) || []; } catch (err) { carrinho = []; }

            var existente = carrinho.filter(function (p) { return p.nome === name; })[0];
            if (existente) {
                existente.quantidade = (existente.quantidade || 1) + 1;
            } else {
                carrinho.push({
                    nome: name,
                    preco: price,
                    imagem: card.querySelector("img").getAttribute("src"),
                    quantidade: 1
                });
            }
            localStorage.setItem("carrinho", JSON.stringify(carrinho));
            notify(name + " foi adicionado ao carrinho!");
        } else {
            notify("Selecionado: " + selectedSize + " — " + selectedColor +
                ". Entre em contato para consultar o valor.");
        }

        closeProduct();
    });

    /* ---------- AUTOPLAY ---------- */

    function startAuto() {
        stopAuto();
        autoplay = setInterval(next, 5500);
    }

    function stopAuto() {
        if (autoplay) clearInterval(autoplay);
        autoplay = null;
    }

    viewport.addEventListener("mouseenter", stopAuto);
    viewport.addEventListener("mouseleave", startAuto);
    viewport.addEventListener("focusin", stopAuto);
    viewport.addEventListener("focusout", startAuto);

    window.addEventListener("resize", function () { go(active); });

    /* ---------- INICIALIZAÇÃO ---------- */

    go(0);
    startAuto();
})();
