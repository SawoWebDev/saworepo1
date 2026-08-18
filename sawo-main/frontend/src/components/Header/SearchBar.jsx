add_shortcode('sawo_heater_calculator', function(){

    $args = [
        'post_type'      => 'product',
        'posts_per_page' => -1,
    ];

    $query            = new WP_Query($args);
    $sawo_hc_products = [];

    while($query->have_posts()){
        $query->the_post();

        $product_id   = get_the_ID();
        $product      = wc_get_product($product_id);
        $external_url = get_post_meta($product_id, '_product_url', true);
        $product_link = !empty($external_url) ? $external_url : get_permalink($product_id);

        $voltages = [];
        $attrs    = $product->get_attributes();

        if(isset($attrs['pa_voltage'])){
            $options  = $attrs['pa_voltage']->get_options();
            $voltages = array_map(function($term_id){
                $term = get_term($term_id, 'pa_voltage');
                $raw  = $term && !is_wp_error($term) ? $term->name : '';
                return floatval(preg_replace('/[^0-9.]/', '', $raw));
            }, $options);
            $voltages = array_values(array_filter($voltages));
        }

        if(!empty($voltages)){
            $sawo_hc_products[] = [
                'name'     => get_the_title(),
                'image'    => get_the_post_thumbnail_url($product_id, 'large'),
                'link'     => $product_link,
                'voltages' => $voltages,
            ];
        }
    }

    wp_reset_postdata();

    ob_start();
    ?>

    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
    #sawo-hc-wrap,
    #sawo-hc-wrap * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: 'Montserrat', sans-serif;
    }
    #sawo-hc-wrap {
        color: rgb(51,51,51);
        width: 100%;
    }

    /* ── Intro ── */
    #sawo-hc-wrap .sawo-hc-intro {
        margin-bottom: 28px;
        text-align: center;
    }
    #sawo-hc-wrap .sawo-hc-intro h1 {
        font-size: 32px !important;
        font-weight: 700 !important;
        color: #af8564 !important;
        font-family: 'Montserrat', sans-serif !important;
        font-style: normal !important;
        margin-bottom: 6px !important;
        line-height: 1.2 !important;
    }
    #sawo-hc-wrap .sawo-hc-intro p {
        font-size: 20px;
        font-weight: 400;
        color: rgb(51,51,51);
        line-height: 1.55;
        max-width: 100%;
        margin: 0 auto;
    }

    /* ── Outer card ── */
    #sawo-hc-wrap .sawo-hc-card {
        background: #fff;
        border: 1.5px solid rgba(175,133,100,0.25);
        border-radius: 10px;
        padding: 32px 36px;
        margin-bottom: 16px;
        transition: box-shadow 0.2s;
    }
    #sawo-hc-wrap .sawo-hc-card:hover {
        box-shadow: 0 6px 24px rgba(175,133,100,0.1);
    }
    #sawo-hc-wrap .sawo-hc-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 24px;
    }
    #sawo-hc-wrap .sawo-hc-card-title {
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: #af8564;
    }
    #sawo-hc-wrap .sawo-hc-card-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
    }

    /* ── Unit toggle ── */
    #sawo-hc-wrap .sawo-hc-unit-toggle {
        display: flex;
        align-items: center;
        background: rgba(175,133,100,0.08);
        border: 1.5px solid rgba(175,133,100,0.25);
        border-radius: 6px;
        overflow: hidden;
    }
    #sawo-hc-wrap .sawo-hc-unit-btn {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #af8564;
        background: transparent;
        border: none;
        padding: 5px 12px;
        cursor: pointer;
        line-height: 1;
        font-family: 'Montserrat', sans-serif;
        transition: background 0.15s, color 0.15s;
    }
    #sawo-hc-wrap .sawo-hc-unit-btn.active {
        background: #af8564;
        color: #fff;
    }
    #sawo-hc-wrap .sawo-hc-unit-btn:hover:not(.active) {
        background: rgba(175,133,100,0.15);
    }

    /* ── Clear button ── */
    #sawo-hc-wrap .sawo-hc-clear-btn {
        display: none;
        background: rgba(175,133,100,0.08);
        border: 1.5px solid rgba(175,133,100,0.25);
        border-radius: 6px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #af8564;
        cursor: pointer;
        padding: 5px 12px;
        line-height: 1;
        font-family: 'Montserrat', sans-serif;
        transition: background 0.15s, color 0.15s;
    }
    #sawo-hc-wrap .sawo-hc-clear-btn:hover {
        background: rgba(175,133,100,0.18);
    }
    #sawo-hc-wrap .sawo-hc-clear-btn.visible { display: inline-block; }

    /* ── Dimension grid: inputs | image (top row) ── */
    #sawo-hc-wrap .sawo-hc-dim-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        align-items: stretch;
    }
    #sawo-hc-wrap .sawo-hc-dim-inputs {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }
    #sawo-hc-wrap .sawo-hc-dim-image {
        border-radius: 10px;
        overflow: hidden;
        min-height: 220px;
        position: relative;
    }
    #sawo-hc-wrap .sawo-hc-dim-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        display: block;
        transition: transform 0.4s ease;
    }
    #sawo-hc-wrap .sawo-hc-dim-image:hover img {
        transform: scale(1.04);
    }

    /* ── Result row: sits below the 2-col grid, inside the card ── */
    #sawo-hc-wrap .sawo-hc-result-row-wrap {
        display: none;
        margin-top: 24px;
    }
    #sawo-hc-wrap .sawo-hc-result-row-wrap.visible {
        display: block;
    }
    #sawo-hc-wrap .sawo-hc-result-combined {
        background: #af8564;
        background-image: linear-gradient(
            175deg,
            rgba(255,255,255,0.18) 0%,
            rgba(255,255,255,0.06) 30%,
            rgba(0,0,0,0.04) 65%,
            rgba(0,0,0,0.1) 100%
        );
        border-radius: 12px;
        display: grid;
        grid-template-columns: 1fr 1px 1fr;
        align-items: center;
        overflow: hidden;
        border: 1px solid rgba(0,0,0,0.08);
        box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.3),
            inset 0 -1px 0 rgba(0,0,0,0.12),
            inset 1px 0 0 rgba(255,255,255,0.1),
            inset -1px 0 0 rgba(0,0,0,0.06),
            0 4px 12px rgba(100,65,35,0.2),
            0 1px 3px rgba(0,0,0,0.12);
        transform: translateY(-2px);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    #sawo-hc-wrap .sawo-hc-result-combined:hover {
        transform: translateY(-4px);
        box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.3),
            inset 0 -1px 0 rgba(0,0,0,0.12),
            inset 1px 0 0 rgba(255,255,255,0.1),
            inset -1px 0 0 rgba(0,0,0,0.06),
            0 8px 20px rgba(100,65,35,0.25),
            0 2px 4px rgba(0,0,0,0.1);
    }
    #sawo-hc-wrap .sawo-hc-result-half {
        padding: 28px 36px;
        text-align: center;
    }
    #sawo-hc-wrap .sawo-hc-result-sep {
        width: 1px;
        height: 56px;
        background: rgba(255,255,255,0.25);
        align-self: center;
    }
    #sawo-hc-wrap .sawo-hc-result-card-label {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: rgba(255,255,255,0.7);
        margin-bottom: 8px;
    }
    #sawo-hc-wrap .sawo-hc-result-card-val {
        font-size: 40px;
        font-weight: 800;
        color: #fff;
        line-height: 1;
    }
    #sawo-hc-wrap .sawo-hc-result-card-val small {
        font-size: 18px;
        font-weight: 500;
        color: rgba(255,255,255,0.65);
        margin-left: 5px;
    }
    #sawo-hc-wrap .sawo-hc-vol-sub {
        font-size: 12px;
        font-weight: 500;
        color: rgba(255,255,255,0.55);
        margin-top: 5px;
        min-height: 16px;
        line-height: 1;
    }
    #sawo-hc-wrap .sawo-hc-field {
        background: #af8564;
        border: 1.5px solid rgba(255,255,255,0.25);
        border-radius: 10px;
        padding: 20px 20px 16px;
        display: flex;
        flex-direction: column;
        gap: 0;
        position: relative;
        transition: border-color 0.15s, background 0.15s, transform 0.18s, box-shadow 0.18s;
    }
    #sawo-hc-wrap .sawo-hc-field:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(175,133,100,0.25);
    }
    #sawo-hc-wrap .sawo-hc-field:focus-within {
        border-color: rgba(255,255,255,0.6);
        background: #9e7558;
    }

    #sawo-hc-wrap .sawo-hc-label {
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #fff;
        margin-bottom: 10px;
    }
    #sawo-hc-wrap .sawo-hc-label-note {
        font-size: 11px;
        font-weight: 500;
        letter-spacing: normal;
        text-transform: none;
        color: rgba(255,255,255,0.6);
    }

    #sawo-hc-wrap .sawo-hc-input-wrap {
        position: relative;
    }
    #sawo-hc-wrap .sawo-hc-inp {
        width: 100%;
        font-size: 28px;
        font-weight: 800;
        color: #fff;
        border: none;
        border-bottom: 2px solid rgba(255,255,255,0.4);
        border-radius: 0;
        padding: 4px 40px 6px 0;
        outline: none;
        background: transparent;
        transition: border-color 0.15s;
        -moz-appearance: textfield;
    }
    #sawo-hc-wrap .sawo-hc-inp::-webkit-inner-spin-button,
    #sawo-hc-wrap .sawo-hc-inp::-webkit-outer-spin-button {
        -webkit-appearance: none;
    }
    #sawo-hc-wrap .sawo-hc-inp:focus {
        border-bottom-color: #fff;
    }
    #sawo-hc-wrap .sawo-hc-inp::placeholder {
        color: rgba(255, 255, 255, 0.718);
        font-family: 'Montserrat', sans-serif;
        font-style: normal;
        font-weight: 700;
        font-size: 24px;
    }
    #sawo-hc-wrap .sawo-hc-unit {
        position: absolute;
        right: 0;
        bottom: 8px;
        font-size: 15px;
        font-weight: 700;
        color: #fff;
    }
    #sawo-hc-wrap .sawo-hc-hint {
        font-size: 11px;
        font-weight: 600;
        color: rgba(255,255,255,0.7);
        margin-top: 8px;
        line-height: 1.4;
        letter-spacing: 0.04em;
    }

    /* ── Recommendations ── */
    #sawo-hc-wrap .sawo-hc-reco-section {
        display: none;
    }
    #sawo-hc-wrap .sawo-hc-reco-section.visible {
        display: block;
    }
    #sawo-hc-wrap .sawo-hc-reco-title {
        font-size: 30px;
        font-weight: 700;
        color: #af8564;
    }
    #sawo-hc-wrap .sawo-hc-reco-sub {
        font-size: 20px;
        font-weight: 400;
        color: #6b5744;
        margin-bottom: 24px;
        line-height: 1.5;
    }
    #sawo-hc-wrap .sawo-hc-reco-sub strong {
        font-weight: 700;
        color: #af8564;
    }

    /* ── Product grid ── */
    #sawo-hc-wrap .sawo-hc-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 20px;
    }
    #sawo-hc-wrap .sawo-hc-product-card {
        display: block;
        text-decoration: none;
        color: inherit;
        background: #fff;
        border: 1.5px solid rgba(175,133,100,0.2);
        border-radius: 12px;
        overflow: hidden;
        transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
    }
    #sawo-hc-wrap .sawo-hc-product-card:hover {
        border-color: #af8564;
        transform: translateY(-4px);
        box-shadow: 0 12px 32px rgba(175,133,100,0.18);
    }
    #sawo-hc-wrap .sawo-hc-img-wrap {
        width: 100%;
        aspect-ratio: 4 / 3;
        background: #f7f5f2;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        transition: background 0.2s;
    }
    #sawo-hc-wrap .sawo-hc-product-card:hover .sawo-hc-img-wrap {
        background: #f0ebe4;
    }
    #sawo-hc-wrap .sawo-hc-product-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        display: block;
        padding: 12px;
        transition: transform 0.35s ease;
    }
    #sawo-hc-wrap .sawo-hc-product-card:hover .sawo-hc-product-img {
        transform: scale(1.05);
    }
    #sawo-hc-wrap .sawo-hc-product-body {
        padding: 14px 16px 16px;
    }
    #sawo-hc-wrap .sawo-hc-product-name {
        font-size: 14px;
        font-weight: 700;
        color: rgb(51,51,51);
        margin-bottom: 10px;
        line-height: 1.35;
        transition: color 0.2s;
    }
    #sawo-hc-wrap .sawo-hc-product-card:hover .sawo-hc-product-name {
        color: #af8564;
    }
    #sawo-hc-wrap .sawo-hc-voltage-list {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
    }
    #sawo-hc-wrap .sawo-hc-voltage-pill {
        font-size: 11px;
        font-weight: 700;
        color: #af8564;
        background: rgba(175,133,100,0.1);
        border: 1px solid rgba(175,133,100,0.25);
        padding: 3px 8px;
        line-height: 1.4;
    }
    #sawo-hc-wrap .sawo-hc-voltage-pill.sawo-hc-match {
        background: #af8564;
        color: #fff;
        border-color: #af8564;
    }
    #sawo-hc-wrap .sawo-hc-no-result {
        font-size: 15px;
        font-weight: 400;
        color: #6b5744;
        padding: 20px 0;
    }

    /* ── Not sure CTA ── */
    #sawo-hc-wrap .sawo-hc-not-sure {
        margin-top: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        flex-wrap: wrap;
        background: #af8564;
        border: 1.5px solid #af8564;
        border-radius: 12px;
        padding: 18px 28px;
    }
    #sawo-hc-wrap .sawo-hc-not-sure-text {
        font-size: 15px;
        font-weight: 500;
        color: #fff;
        line-height: 1.4;
    }
    #sawo-hc-wrap .sawo-hc-not-sure-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #fff;
        color: #af8564;
        border: 1.5px solid #af8564;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-decoration: none;
        border-radius: 6px;
        padding: 9px 17px;
        white-space: nowrap;
        font-family: 'Montserrat', sans-serif;
        transition: background 0.18s, color 0.18s, transform 0.15s;
    }
    #sawo-hc-wrap .sawo-hc-not-sure-btn:hover {
        background: transparent;
        color:#fff;
        border: 0px solid #fff;
        box-shadow: 0 0 0 3px #fff;
        transform: translateX(2px);
    }
    #sawo-hc-wrap .sawo-hc-not-sure-btn svg {
        flex-shrink: 0;
    }

    /* ── Responsive ── */
    @media (max-width: 640px) {
        #sawo-hc-wrap .sawo-hc-intro p  { font-size: 16px; line-height: 1.5; }
        #sawo-hc-wrap .sawo-hc-intro h1 { font-size: 24px; }
        #sawo-hc-wrap .sawo-hc-card     { padding: 20px 16px; border-radius: 8px; }
        #sawo-hc-wrap .sawo-hc-dim-row  { grid-template-columns: 1fr; }
        #sawo-hc-wrap .sawo-hc-dim-image { min-height: 200px; }
        #sawo-hc-wrap .sawo-hc-inp      { font-size: 22px; }
        #sawo-hc-wrap .sawo-hc-result-row-wrap { margin-top: 16px; }
        #sawo-hc-wrap .sawo-hc-result-combined { grid-template-columns: 1fr 1px 1fr; }
        #sawo-hc-wrap .sawo-hc-result-half { padding: 20px 16px; }
        #sawo-hc-wrap .sawo-hc-result-card-val { font-size: 28px; }
        #sawo-hc-wrap .sawo-hc-grid     { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }

        /* Sticky result bar */
        #sawo-hc-wrap .sawo-hc-result-row-wrap.sticky {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 9999;
            margin: 0;
            padding: 10px 16px 12px;
            background: #fff;
            box-shadow: 0 -4px 20px rgba(100,65,35,0.18), 0 -1px 0 rgba(175,133,100,0.15);
            border-top: 1px solid rgba(175,133,100,0.2);
        }
        #sawo-hc-wrap .sawo-hc-result-row-wrap.sticky .sawo-hc-result-combined {
            transform: none;
            border-radius: 8px;
        }
    }
    </style>

    <div id="sawo-hc-wrap">

        <div class="sawo-hc-intro">
            <h1 style="font-family:'Montserrat',sans-serif;font-style:normal;font-weight:700;color:rgb(175,133,100);font-size:32px;">Sauna Volume Calculator</h1>
            <p>The size of your sauna directly affects the heater power required. Use this sauna volume calculator to measure your sauna room dimensions and get a precise heater recommendation in kW for optimal performance.</p>
        </div>

        <div class="sawo-hc-card">
            <div class="sawo-hc-card-header">
                <div class="sawo-hc-card-title">Room Dimensions</div>
                <div class="sawo-hc-card-controls">
                    <button class="sawo-hc-clear-btn" id="sawo-hc-clear-btn" onclick="sawoHcClear()">Clear</button>
                    <div class="sawo-hc-unit-toggle">
                        <button class="sawo-hc-unit-btn active" data-unit="m" onclick="sawoHcToggleUnit('m')">m</button>
                        <button class="sawo-hc-unit-btn" data-unit="ft" onclick="sawoHcToggleUnit('ft')">ft</button>
                    </div>
                </div>
            </div>

            <div class="sawo-hc-dim-row">
                <div class="sawo-hc-dim-inputs">
                    <div class="sawo-hc-field">
                        <span class="sawo-hc-label">Width <span class="sawo-hc-label-note">(side to side)</span></span>
                        <div class="sawo-hc-input-wrap">
                            <input class="sawo-hc-inp" id="sawo-hc-w" type="number" step="0.1" min="0" placeholder="2.4" oninput="sawoHcAuto()">
                            <span class="sawo-hc-unit">m</span>
                        </div>
                        <span class="sawo-hc-hint" data-m="typical sauna: 1.8&#8211;2.4 m" data-ft="typical sauna: 6&#8211;8 ft">typical sauna: 1.8&#8211;2.4 m</span>
                    </div>
                    <div class="sawo-hc-field">
                        <span class="sawo-hc-label">Height <span class="sawo-hc-label-note">(floor to ceiling)</span></span>
                        <div class="sawo-hc-input-wrap">
                            <input class="sawo-hc-inp" id="sawo-hc-h" type="number" step="0.1" min="0" placeholder="2.1" oninput="sawoHcAuto()">
                            <span class="sawo-hc-unit">m</span>
                        </div>
                        <span class="sawo-hc-hint" data-m="standard ceiling: 2.1 m" data-ft="standard ceiling: 7 ft">standard ceiling: 2.1 m</span>
                    </div>
                    <div class="sawo-hc-field">
                        <span class="sawo-hc-label">Depth <span class="sawo-hc-label-note">(door to back wall)</span></span>
                        <div class="sawo-hc-input-wrap">
                            <input class="sawo-hc-inp" id="sawo-hc-d" type="number" step="0.1" min="0" placeholder="1.8" oninput="sawoHcAuto()">
                            <span class="sawo-hc-unit">m</span>
                        </div>
                        <span class="sawo-hc-hint" data-m="typical sauna: 1.8&#8211;2.4 m" data-ft="typical sauna: 6&#8211;8 ft">typical sauna: 1.8&#8211;2.4 m</span>
                    </div>
                    <div class="sawo-hc-field">
                        <span class="sawo-hc-label">Uninsulated Surfaces <span class="sawo-hc-label-note">(glass, tile, stone or concrete walls)</span></span>
                        <div class="sawo-hc-input-wrap">
                            <input class="sawo-hc-inp" id="sawo-hc-u" type="number" step="0.1" min="0" placeholder="0" oninput="sawoHcAuto()">
                            <span class="sawo-hc-unit" id="sawo-hc-u-unit">m&#178;</span>
                        </div>
                        <span class="sawo-hc-hint" data-m="Leave 0 if fully wood-lined" data-ft="Leave 0 if fully wood-lined">Leave 0 if fully wood-lined</span>
                    </div>
                </div>

                <div class="sawo-hc-dim-image">
                    <img src="https://www.sawo.com/wp-content/uploads/2026/05/CUB3-Ni2_InsideSaunaRoom-sauna-calculator.webp" alt="Inside a SAWO sauna room">
                </div>
            </div>

            <div class="sawo-hc-result-row-wrap" id="sawo-hc-result">
                <div class="sawo-hc-result-combined">
                    <div class="sawo-hc-result-half">
                        <div class="sawo-hc-result-card-label">Sauna Volume</div>
                        <div class="sawo-hc-result-card-val"><span id="sawo-hc-vol-out">0</span><small>m&#179;</small></div>
                        <div class="sawo-hc-vol-sub" id="sawo-hc-vol-sub"></div>
                    </div>
                    <div class="sawo-hc-result-sep"></div>
                    <div class="sawo-hc-result-half">
                        <div class="sawo-hc-result-card-label">Recommended Heater</div>
                        <div class="sawo-hc-result-card-val"><span id="sawo-hc-kw-out">0</span><small>kW</small></div>
                        <div class="sawo-hc-vol-sub" id="sawo-hc-kw-sub"></div>
                    </div>
                </div>
            </div>

        </div>

        <div class="sawo-hc-reco-section" id="sawo-hc-reco-section">
            <div class="sawo-hc-reco-title">Recommended Heaters</div>
            <div class="sawo-hc-reco-sub" id="sawo-hc-reco-sub"></div>
            <div class="sawo-hc-grid" id="sawo-hc-grid"></div>
            <div class="sawo-hc-not-sure">
                <span class="sawo-hc-not-sure-text">Not sure which heater is right for you?</span>
                <a href="/contact" class="sawo-hc-not-sure-btn">Contact our sauna experts <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
            </div>
        </div>

    </div>

    <script>
    (function(){
        const sawoHcProducts = <?php echo json_encode($sawo_hc_products); ?>;

        let sawoHcImperial   = false;
        let sawoHcLastVol    = null;
        let sawoHcLastKw     = null;
        let sawoHcNaturalTop = 0;

        const PLACEHOLDERS_M  = ['2.4', '2.1', '1.8'];
        const PLACEHOLDERS_FT = ['7.9', '6.9', '5.9'];

        const SAWO_RANGE_TABLE = [
            { kw: 2.3, min: 1,  max: 3  },
            { kw: 3.0, min: 2,  max: 4  },
            { kw: 3.6, min: 3,  max: 5  },
            { kw: 4.5, min: 3,  max: 6  },
            { kw: 6.0, min: 5,  max: 9  },
            { kw: 8.0, min: 7,  max: 13 },
            { kw: 9.0, min: 8,  max: 14 },
            { kw: 12.0, min: 11, max: 18 },
        ];

        function sawoHcRound(n){ return Math.round(n * 10) / 10; }

        function sawoHcClosest(effectiveVolume){
            const tableByMax = SAWO_RANGE_TABLE.slice().sort((a, b) => a.max - b.max);

            const fits = tableByMax.filter(e => effectiveVolume >= e.min && effectiveVolume <= e.max);
            if(fits.length){
                const best = fits.reduce((a, b) => a.max < b.max ? a : b);
                return { match: best.kw, oversized: false };
            }

            const tableByKw = SAWO_RANGE_TABLE.slice().sort((a, b) => a.kw - b.kw);
            const nextUp = tableByKw.find(e => e.min >= effectiveVolume);
            if(nextUp) return { match: nextUp.kw, oversized: false };

            const largest = tableByKw[tableByKw.length - 1];
            return { match: largest.kw, oversized: true };
        }

        function sawoHcAnimate(el, from, to, decimals, onDone){
            const start = performance.now();
            const dur   = 400;
            function step(now){
                const t    = Math.min((now - start) / dur, 1);
                const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
                const val  = from + (to - from) * ease;
                el.textContent = decimals ? parseFloat(val.toFixed(1)) : Math.round(val);
                if(t < 1) requestAnimationFrame(step);
                else { el.textContent = to; if(onDone) onDone(); }
            }
            requestAnimationFrame(step);
        }

        window.sawoHcToggleUnit = function(unit){
            sawoHcImperial = (unit === 'ft');
            document.querySelectorAll('#sawo-hc-wrap .sawo-hc-unit-btn').forEach(function(btn){
                btn.classList.toggle('active', btn.dataset.unit === unit);
            });
            const ids = ['sawo-hc-w', 'sawo-hc-h', 'sawo-hc-d'];
            ids.forEach(function(id, i){
                const inp = document.getElementById(id);
                inp.placeholder = sawoHcImperial ? PLACEHOLDERS_FT[i] : PLACEHOLDERS_M[i];
                if(inp.value){
                    const v = parseFloat(inp.value);
                    inp.value = sawoHcImperial ? sawoHcRound(v * 3.28084) : sawoHcRound(v / 3.28084);
                }
            });

            const uInp = document.getElementById('sawo-hc-u');
            if(uInp.value){
                const v = parseFloat(uInp.value);
                uInp.value = sawoHcImperial ? sawoHcRound(v * 3.28084 * 3.28084) : sawoHcRound(v / (3.28084 * 3.28084));
            }
            document.getElementById('sawo-hc-u-unit').innerHTML = sawoHcImperial ? 'ft&#178;' : 'm&#178;';

            document.querySelectorAll('#sawo-hc-wrap .sawo-hc-hint').forEach(function(el){
                el.textContent = el.dataset[sawoHcImperial ? 'ft' : 'm'];
            });
            document.querySelectorAll('#sawo-hc-wrap .sawo-hc-unit').forEach(function(el){
                if(el.id === 'sawo-hc-u-unit') return;
                el.textContent = sawoHcImperial ? 'ft' : 'm';
            });
            sawoHcLastVol = null;
            sawoHcLastKw  = null;
            sawoHcAuto();
        };

        window.sawoHcClear = function(){
            ['sawo-hc-w','sawo-hc-h','sawo-hc-d','sawo-hc-u'].forEach(function(id){
                document.getElementById(id).value = '';
            });
            const resultEl = document.getElementById('sawo-hc-result');
            resultEl.classList.remove('visible', 'sticky');
            document.getElementById('sawo-hc-reco-section').classList.remove('visible');
            document.getElementById('sawo-hc-clear-btn').classList.remove('visible');
            sawoHcLastVol = null;
            sawoHcLastKw  = null;
        };

        window.sawoHcAuto = function(){
            const wRaw = parseFloat(document.getElementById('sawo-hc-w').value) || 0;
            const hRaw = parseFloat(document.getElementById('sawo-hc-h').value) || 0;
            const dRaw = parseFloat(document.getElementById('sawo-hc-d').value) || 0;
            const uRaw = parseFloat(document.getElementById('sawo-hc-u').value) || 0;

            const resultEl = document.getElementById('sawo-hc-result');
            const recoEl   = document.getElementById('sawo-hc-reco-section');
            const recoSub  = document.getElementById('sawo-hc-reco-sub');
            const grid     = document.getElementById('sawo-hc-grid');
            const volOut   = document.getElementById('sawo-hc-vol-out');
            const kwOut    = document.getElementById('sawo-hc-kw-out');
            const volSub   = document.getElementById('sawo-hc-vol-sub');
            const kwSub    = document.getElementById('sawo-hc-kw-sub');
            const clearBtn = document.getElementById('sawo-hc-clear-btn');

            const allFilled = wRaw && hRaw && dRaw;
            clearBtn.classList.toggle('visible', !!(allFilled || uRaw));

            if(!allFilled){
                resultEl.classList.remove('visible');
                recoEl.classList.remove('visible');
                return;
            }

            const factor       = sawoHcImperial ? (1 / 3.28084) : 1;
            const volume        = sawoHcRound(wRaw * factor * hRaw * factor * dRaw * factor);
            const uninsulatedM2 = sawoHcRound(uRaw * factor * factor);
            const effectiveVolume = sawoHcRound(volume + (uninsulatedM2 * 1.2));
            const { match: matchKw, oversized } = sawoHcClosest(effectiveVolume);

            // Animate volume (actual volume is always what's displayed as the headline figure)
            if(volume !== sawoHcLastVol){
                const fromVol = sawoHcLastVol !== null ? sawoHcLastVol : 0;
                sawoHcAnimate(volOut, fromVol, volume, true, null);
                sawoHcLastVol = volume;
            }

            // Sub-line: ft³ conversion (imperial) and/or effective volume (when uninsulated area > 0)
            const subParts = [];
            if(sawoHcImperial){
                subParts.push('(' + sawoHcRound(volume * 35.3147) + ' ft³)');
            }
            if(uninsulatedM2 > 0){
                subParts.push('Effective: ' + effectiveVolume + ' m³');
            }
            volSub.textContent = subParts.join(' · ');

            // Animate kW
            if(matchKw !== sawoHcLastKw){
                const fromKw = sawoHcLastKw !== null ? sawoHcLastKw : 0;
                sawoHcAnimate(kwOut, fromKw, matchKw, true, null);
                sawoHcLastKw = matchKw;
            }
            kwSub.textContent = oversized ? 'Exceeds standard range, contact us for advice' : '';

            if(!resultEl.classList.contains('visible')){
                resultEl.classList.add('visible');
                requestAnimationFrame(function(){
                    sawoHcNaturalTop = resultEl.getBoundingClientRect().top + window.scrollY;
                });
            }

            const matched = sawoHcProducts.filter(p =>
                p.voltages.some(v => Math.abs(v - matchKw) < 0.05)
            );

            recoSub.innerHTML = matched.length
                ? 'Showing heaters compatible with <strong>' + matchKw + ' kW</strong> for a <strong>' + volume + ' m³</strong> sauna. '
                  + 'Many heaters are available in multiple power ratings. The <span style="display:inline-block;font-size:14px;font-weight:700;color:#fff;background:#af8564;border:1px solid #af8564;padding:2px 9px;line-height:1.4;vertical-align:middle;border-radius:2px;">highlighted kW</span> on each product shows the size that fits your sauna.'
                : '';

            grid.innerHTML = '';

            if(!matched.length){
                grid.innerHTML = '<p class="sawo-hc-no-result">No heaters found for this power rating. Please contact us for advice.</p>';
            } else {
                matched.forEach(function(product){
                    const pills = product.voltages
                        .slice().sort((a,b) => a - b)
                        .map(function(v){
                            const isMatch = Math.abs(v - matchKw) < 0.05;
                            return '<span class="sawo-hc-voltage-pill' + (isMatch ? ' sawo-hc-match' : '') + '">' + v + ' kW</span>';
                        }).join('');

                    grid.innerHTML +=
                        '<a href="' + product.link + '" class="sawo-hc-product-card">' +
                            '<div class="sawo-hc-img-wrap">' +
                                '<img src="' + product.image + '" class="sawo-hc-product-img" alt="' + product.name + '">' +
                            '</div>' +
                            '<div class="sawo-hc-product-body">' +
                                '<div class="sawo-hc-product-name">' + product.name + '</div>' +
                                '<div class="sawo-hc-voltage-list">' + pills + '</div>' +
                            '</div>' +
                        '</a>';
                });
            }

            recoEl.classList.add('visible');
        };

        // Sticky result bar on mobile: fix to bottom when scrolled past natural position
        window.addEventListener('scroll', function(){
            if(window.innerWidth > 640) return;
            const resultEl = document.getElementById('sawo-hc-result');
            if(!resultEl.classList.contains('visible')) return;
            const scrolledPast = window.scrollY > sawoHcNaturalTop + resultEl.offsetHeight;
            resultEl.classList.toggle('sticky', scrolledPast);
        }, { passive: true });

    })();
    </script>

    <?php
    return ob_get_clean();
});
