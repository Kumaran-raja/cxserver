<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * Open WhatsApp with pre-filled message (wa.me)
     * Automatically adds '91' if phone is 10-digit Indian number.
     *
     * @param string $phone   Indian mobile (10 digits or 12 with 91)
     * @param string $message Message text
     * @return bool
     */
    public static function open(string $phone, string $message): bool
    {
        // Step 1: Clean phone - remove all non-digits
        $clean = preg_replace('/\D/', '', $phone);

        // Step 2: Normalize to 12-digit with country code
        if (strlen($clean) === 10 && preg_match('/^[6-9]\d{9}$/', $clean)) {
            $clean = '91' . $clean; // Add 91 for 10-digit Indian number
        }

        // Step 3: Validate final 12-digit Indian number
        if (!preg_match('/^91[6-9]\d{9}$/', $clean)) {
            Log::warning("WhatsAppService: Invalid phone after normalization: {$phone} → {$clean}");
            return false;
        }

        // Step 4: Build wa.me URL
        $url = 'https://wa.me/' . $clean . '?text=' . rawurlencode($message);

        // Step 5: Open in default browser
        try {
            $cmd = match (PHP_OS_FAMILY) {
                'Windows' => 'start "" "' . $url . '"',
                'Darwin'  => 'open "' . $url . '"',
                default   => 'xdg-open "' . $url . '"',
            };

            exec($cmd);

            Log::info("WhatsApp link opened: {$url}");
            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to open WhatsApp: " . $e->getMessage());
            return false;
        }
    }
}
