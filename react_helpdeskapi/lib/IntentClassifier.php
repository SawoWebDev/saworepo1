<?php

/**
 * Decides what a contact-form submission is actually about, so SendRespond
 * can pick the right auto-reply template.
 *
 * The form's own category dropdown is trusted first — the customer told us
 * directly. Keyword scoring only runs when that field is missing or generic.
 *
 * Copied from helpdeskapi/lib/IntentClassifier.php verbatim.
 */
class IntentClassifier
{
    const SALES = 'sales';        // pricing, quotes, availability, buying
    const TECHNICAL = 'technical';    // broken, error codes, install help, wiring
    const WARRANTY = 'warranty';     // claims, returns, replacement parts
    const DEALER = 'dealer';       // distributor / reseller / bulk
    const FEEDBACK = 'feedback';     // praise, complaints, suggestions
    const GENERAL = 'general';      // fallback when nothing scores

    /**
     * Category dropdown values that already tell us the intent outright.
     * Keys are matched case-insensitively against a normalized category string.
     */
    private static $categoryMap = [
        'sales' => self::SALES,
        'sales inquiry' => self::SALES,
        'pricing' => self::SALES,
        'quote' => self::SALES,
        'request a quote' => self::SALES,
        'purchase' => self::SALES,
        'technical' => self::TECHNICAL,
        'technical inquiry' => self::TECHNICAL,
        'technical support' => self::TECHNICAL,
        'support' => self::TECHNICAL,
        'service' => self::TECHNICAL,
        'warranty' => self::WARRANTY,
        'warranty claim' => self::WARRANTY,
        'returns' => self::WARRANTY,
        'spare parts' => self::WARRANTY,
        'dealer' => self::DEALER,
        'distributor' => self::DEALER,
        'become a dealer' => self::DEALER,
        'wholesale' => self::DEALER,
        'feedback' => self::FEEDBACK,
        'complaint' => self::FEEDBACK,
    ];

    /**
     * Phrases weighted by how strongly they point at one intent.
     *
     * Weight 3 = decisive on its own ("how much does it cost").
     * Weight 2 = strong but can appear in other contexts.
     * Weight 1 = weak hint, only matters when it stacks with others.
     *
     * Multi-word phrases are deliberately preferred over bare words: "price"
     * alone also appears in "I paid a high price and it broke", while
     * "price list" essentially never shows up outside a sales inquiry.
     */
    private static $keywords = [
        self::SALES => [
            3 => [
                'price list', 'pricing', 'how much does', 'how much is', 'how much for',
                'request a quote', 'send me a quote', 'get a quote', 'quotation',
                'i want to buy', 'i would like to buy', 'want to purchase',
                'place an order', 'proforma', 'moq', 'minimum order',
            ],
            2 => [
                'quote', 'cost of', 'lead time', 'availability', 'in stock',
                'shipping cost', 'freight', 'delivery time', 'discount',
                'payment terms', 'invoice', 'catalog', 'catalogue', 'price',
            ],
            1 => ['buy', 'purchase', 'order', 'interested in', 'looking for', 'budget'],
        ],
        self::TECHNICAL => [
            3 => [
                'not working', 'stopped working', 'does not work', "doesn't work",
                'error code', 'not heating', 'wont turn on', "won't turn on",
                'tripping the breaker', 'keeps shutting', 'overheating',
                'how do i install', 'installation instructions', 'wiring diagram',
            ],
            2 => [
                'broken', 'defective', 'malfunction', 'fault', 'troubleshoot',
                'repair', 'error', 'installation', 'install', 'wiring',
                'manual', 'instructions', 'setup', 'configure', 'sensor',
                'thermostat', 'control panel', 'stopped', 'leaking', 'noise',
            ],
            1 => ['problem', 'issue', 'help with', 'not sure how', 'voltage', 'amperage'],
        ],
        self::WARRANTY => [
            3 => [
                'warranty claim', 'under warranty', 'still under warranty',
                'replacement part', 'spare part', 'return it', 'refund',
                'rma', 'defective on arrival', 'arrived damaged',
            ],
            2 => ['warranty', 'guarantee', 'replace', 'replacement', 'return', 'damaged'],
            1 => ['receipt', 'proof of purchase', 'serial number'],
        ],
        self::DEALER => [
            3 => [
                'become a dealer', 'become a distributor', 'dealer application',
                'distribution rights', 'resell your', 'wholesale price',
                'bulk order', 'partnership opportunity',
            ],
            2 => ['dealer', 'distributor', 'reseller', 'wholesale', 'bulk', 'b2b'],
            1 => ['partner', 'representative', 'our company', 'our store'],
        ],
        self::FEEDBACK => [
            3 => [
                'just wanted to say', 'thank you for the great', 'very disappointed',
                'poor service', 'excellent service', 'love my sauna', 'leave a review',
            ],
            2 => ['feedback', 'suggestion', 'complaint', 'compliment', 'review', 'satisfied'],
            1 => ['happy with', 'unhappy', 'great', 'terrible', 'recommend'],
        ],
    ];

    /**
     * Words that flip a sales-looking message into a support one. Someone who
     * already owns the product is not asking to buy it.
     */
    private static $ownershipMarkers = [
        'i bought', 'i purchased', 'i have had', 'i own', 'we installed',
        'my heater', 'my sauna', 'my unit', 'purchased last', 'bought last',
        'ordered last', 'received my', 'delivered last',
    ];

    /**
     * @param string $category Category value from the form dropdown.
     * @param string $message  Free-text message / issue body.
     * @param string $subject  Subject line, if the form collects one.
     * @return array{intent:string, confidence:string, scores:array, source:string}
     */
    public static function classify($category = '', $message = '', $subject = '')
    {
        $fromCategory = self::fromCategory($category);
        if ($fromCategory !== null) {
            return [
                'intent' => $fromCategory,
                'confidence' => 'high',
                'scores' => [],
                'source' => 'category',
            ];
        }

        return self::fromText(trim($subject . ' ' . $message));
    }

    /**
     * Maps the dropdown value onto an intent, or null when the value is
     * generic ("Other", "General") and the text needs to decide instead.
     */
    private static function fromCategory($category)
    {
        $key = strtolower(trim($category));
        if ($key === '') {
            return null;
        }

        if (isset(self::$categoryMap[$key])) {
            return self::$categoryMap[$key];
        }

        // Partial match: "Technical Support / Service" -> technical
        foreach (self::$categoryMap as $needle => $intent) {
            if (strpos($key, $needle) !== false) {
                return $intent;
            }
        }

        return null;
    }

    /**
     * Scores the text against every intent and returns the winner.
     */
    private static function fromText($text)
    {
        $haystack = self::normalize($text);

        $scores = [];
        foreach (self::$keywords as $intent => $tiers) {
            $score = 0;
            foreach ($tiers as $weight => $phrases) {
                foreach ($phrases as $phrase) {
                    if (strpos($haystack, ' ' . $phrase . ' ') !== false) {
                        $score += $weight;
                    }
                }
            }
            $scores[$intent] = $score;
        }

        // Someone describing a product they already own is asking for support,
        // even when they use words like "order" or "delivery".
        if (self::mentionsOwnership($haystack) && $scores[self::SALES] > 0) {
            $scores[self::SALES] = max(0, $scores[self::SALES] - 3);
            $scores[self::TECHNICAL] += 2;
        }

        arsort($scores);
        $intent = key($scores);
        $top = current($scores);
        next($scores);
        $runnerUp = current($scores) ?: 0;

        if ($top === 0) {
            return [
                'intent' => self::GENERAL,
                'confidence' => 'none',
                'scores' => $scores,
                'source' => 'text',
            ];
        }

        // A clear winner needs both an absolute floor and daylight between it
        // and second place — otherwise the message is genuinely mixed and a
        // human should decide.
        if ($top >= 3 && $top - $runnerUp >= 2) {
            $confidence = 'high';
        } elseif ($top >= 2) {
            $confidence = 'medium';
        } else {
            $confidence = 'low';
        }

        return [
            'intent' => $intent,
            'confidence' => $confidence,
            'scores' => $scores,
            'source' => 'text',
        ];
    }

    private static function mentionsOwnership($haystack)
    {
        foreach (self::$ownershipMarkers as $marker) {
            if (strpos($haystack, ' ' . $marker . ' ') !== false) {
                return true;
            }
        }
        return false;
    }

    /**
     * Lowercases, strips punctuation and collapses whitespace, then pads with
     * spaces so phrase lookups can use word boundaries via plain strpos.
     */
    private static function normalize($text)
    {
        $text = mb_strtolower($text, 'UTF-8');
        $text = str_replace(['’', '‘', '“', '”'], ["'", "'", '"', '"'], $text);
        $text = preg_replace('/[^a-z0-9\'\s]+/u', ' ', $text);
        $text = preg_replace('/\s+/', ' ', $text);
        return ' ' . trim($text) . ' ';
    }
}
