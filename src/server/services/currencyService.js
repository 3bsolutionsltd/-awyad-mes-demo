/**
 * Currency Service - Multi-currency support and exchange rate management
 * 
 * Handles:
 * - Exchange rate management
 * - Currency conversion with date-specific rates
 * - Support for UGX (default), USD, EUR, GBP
 * - Rate history and updates
 * 
 * @module currencyService
 */

import databaseService from './databaseService.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

// Supported currencies
export const SUPPORTED_CURRENCIES = ['UGX', 'USD', 'EUR', 'GBP'];
export const DEFAULT_CURRENCY = 'UGX';

/**
 * Get exchange rate for specific date
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {Date} date - Date for the exchange rate (defaults to today)
 * @returns {Promise<number>} Exchange rate
 */
export async function getExchangeRate(fromCurrency, toCurrency, date = new Date()) {
    try {
        // Same currency = rate of 1
        if (fromCurrency === toCurrency) {
            return 1.0;
        }

        // Validate currencies
        if (!SUPPORTED_CURRENCIES.includes(fromCurrency) || !SUPPORTED_CURRENCIES.includes(toCurrency)) {
            throw new AppError(`Unsupported currency. Supported: ${SUPPORTED_CURRENCIES.join(', ')}`, 400);
        }

        // Query for the most recent rate on or before the given date
        const query = `
            SELECT rate, effective_date
            FROM currency_rates
            WHERE from_currency = $1
                AND to_currency = $2
                AND effective_date <= $3
                AND is_active = true
            ORDER BY effective_date DESC
            LIMIT 1
        `;

        const result = await databaseService.query(query, [fromCurrency, toCurrency, date]);

        if (result.rows.length === 0) {
            // Try inverse rate
            const inverseQuery = `
                SELECT 1.0 / rate as rate, effective_date
                FROM currency_rates
                WHERE from_currency = $1
                    AND to_currency = $2
                    AND effective_date <= $3
                    AND is_active = true
                ORDER BY effective_date DESC
                LIMIT 1
            `;
            
            const inverseResult = await databaseService.query(inverseQuery, [toCurrency, fromCurrency, date]);
            
            if (inverseResult.rows.length === 0) {
                throw new AppError(`No exchange rate found for ${fromCurrency} to ${toCurrency} on or before ${date}`, 404);
            }
            
            return parseFloat(inverseResult.rows[0].rate);
        }

        return parseFloat(result.rows[0].rate);
    } catch (error) {
        logger.error('Error getting exchange rate:', error);
        throw error;
    }
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @param {Date} date - Date for conversion (defaults to today)
 * @returns {Promise<Object>} Converted amount and rate used
 */
export async function convertAmount(amount, fromCurrency, toCurrency, date = new Date()) {
    try {
        const rate = await getExchangeRate(fromCurrency, toCurrency, date);
        const convertedAmount = amount * rate;

        return {
            originalAmount: amount,
            originalCurrency: fromCurrency,
            convertedAmount: parseFloat(convertedAmount.toFixed(2)),
            targetCurrency: toCurrency,
            exchangeRate: rate,
            conversionDate: date
        };
    } catch (error) {
        logger.error('Error converting amount:', error);
        throw error;
    }
}

/**
 * Update or create exchange rate
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @param {number} rate - Exchange rate
 * @param {Date} effectiveDate - Date the rate becomes effective
 * @param {string} source - Source of the rate (manual, api, official)
 * @param {UUID} userId - User creating the rate
 * @returns {Promise<Object>} Created rate record
 */
export async function updateExchangeRate(fromCurrency, toCurrency, rate, effectiveDate, source = 'manual', userId = null) {
    try {
        // Validate currencies
        if (!SUPPORTED_CURRENCIES.includes(fromCurrency) || !SUPPORTED_CURRENCIES.includes(toCurrency)) {
            throw new AppError(`Unsupported currency. Supported: ${SUPPORTED_CURRENCIES.join(', ')}`, 400);
        }

        if (fromCurrency === toCurrency) {
            throw new AppError('Cannot create exchange rate for same currency', 400);
        }

        if (rate <= 0) {
            throw new AppError('Exchange rate must be positive', 400);
        }

        const query = `
            INSERT INTO currency_rates (
                from_currency, 
                to_currency, 
                rate, 
                effective_date, 
                source,
                created_by,
                is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, true)
            RETURNING *
        `;

        const result = await databaseService.query(query, [
            fromCurrency,
            toCurrency,
            rate,
            effectiveDate,
            source,
            userId
        ]);

        logger.info(`Exchange rate updated: ${fromCurrency}/${toCurrency} = ${rate} (effective: ${effectiveDate})`);

        return result.rows[0];
    } catch (error) {
        logger.error('Error updating exchange rate:', error);
        throw error;
    }
}

/**
 * Get all active exchange rates
 * @param {Date} date - Date for rates (defaults to today)
 * @returns {Promise<Array>} List of current rates
 */
export async function getAllRates(date = new Date()) {
    try {
        const query = `
            WITH latest_rates AS (
                SELECT DISTINCT ON (from_currency, to_currency)
                    id,
                    from_currency,
                    to_currency,
                    rate,
                    effective_date,
                    source
                FROM currency_rates
                WHERE effective_date <= $1
                    AND is_active = true
                ORDER BY from_currency, to_currency, effective_date DESC
            )
            SELECT * FROM latest_rates
            ORDER BY from_currency, to_currency
        `;

        const result = await databaseService.query(query, [date]);
        return result.rows;
    } catch (error) {
        logger.error('Error getting all rates:', error);
        throw error;
    }
}

/**
 * Get exchange rate history
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @param {Date} startDate - Start date for history
 * @param {Date} endDate - End date for history
 * @returns {Promise<Array>} Rate history
 */
export async function getRateHistory(fromCurrency, toCurrency, startDate, endDate = new Date()) {
    try {
        const query = `
            SELECT 
                id,
                from_currency,
                to_currency,
                rate,
                effective_date,
                source,
                created_at,
                created_by
            FROM currency_rates
            WHERE from_currency = $1
                AND to_currency = $2
                AND effective_date BETWEEN $3 AND $4
                AND is_active = true
            ORDER BY effective_date DESC
        `;

        const result = await databaseService.query(query, [fromCurrency, toCurrency, startDate, endDate]);
        return result.rows;
    } catch (error) {
        logger.error('Error getting rate history:', error);
        throw error;
    }
}

/**
 * Deactivate an exchange rate
 * @param {UUID} rateId - Rate ID to deactivate
 * @param {UUID} userId - User deactivating the rate
 * @returns {Promise<Object>} Updated rate
 */
export async function deactivateRate(rateId, userId) {
    try {
        const query = `
            UPDATE currency_rates
            SET is_active = false,
                updated_at = CURRENT_TIMESTAMP,
                updated_by = $2
            WHERE id = $1
            RETURNING *
        `;

        const result = await databaseService.query(query, [rateId, userId]);
        
        if (result.rows.length === 0) {
            throw new AppError('Exchange rate not found', 404);
        }

        return result.rows[0];
    } catch (error) {
        logger.error('Error deactivating rate:', error);
        throw error;
    }
}

/**
 * Initialize default exchange rates (for setup)
 * @returns {Promise<void>}
 */
export async function initializeDefaultRates() {
    try {
        const today = new Date();
        
        // Default rates (example rates - should be updated with real rates)
        const defaultRates = [
            { from: 'USD', to: 'UGX', rate: 3700 },
            { from: 'EUR', to: 'UGX', rate: 4000 },
            { from: 'GBP', to: 'UGX', rate: 4700 },
            { from: 'UGX', to: 'USD', rate: 1 / 3700 },
            { from: 'UGX', to: 'EUR', rate: 1 / 4000 },
            { from: 'UGX', to: 'GBP', rate: 1 / 4700 }
        ];

        for (const rateData of defaultRates) {
            // Check if rate exists
            const existing = await databaseService.query(
                'SELECT id FROM currency_rates WHERE from_currency = $1 AND to_currency = $2 AND is_active = true',
                [rateData.from, rateData.to]
            );

            if (existing.rows.length === 0) {
                await updateExchangeRate(
                    rateData.from,
                    rateData.to,
                    rateData.rate,
                    today,
                    'system',
                    null
                );
            }
        }

        logger.info('Default exchange rates initialized');
    } catch (error) {
        logger.error('Error initializing default rates:', error);
        throw error;
    }
}

/**
 * Convert multiple amounts to base currency (UGX)
 * @param {Array} amounts - Array of {amount, currency} objects
 * @param {Date} date - Date for conversion
 * @returns {Promise<Object>} Total in UGX and breakdown
 */
export async function convertToBaseCurrency(amounts, date = new Date()) {
    try {
        let totalUGX = 0;
        const breakdown = [];

        for (const item of amounts) {
            if (item.currency === DEFAULT_CURRENCY) {
                totalUGX += item.amount;
                breakdown.push({
                    originalAmount: item.amount,
                    currency: item.currency,
                    convertedAmount: item.amount,
                    rate: 1
                });
            } else {
                const converted = await convertAmount(item.amount, item.currency, DEFAULT_CURRENCY, date);
                totalUGX += converted.convertedAmount;
                breakdown.push({
                    originalAmount: item.amount,
                    currency: item.currency,
                    convertedAmount: converted.convertedAmount,
                    rate: converted.exchangeRate
                });
            }
        }

        return {
            totalUGX: parseFloat(totalUGX.toFixed(2)),
            baseCurrency: DEFAULT_CURRENCY,
            breakdown,
            conversionDate: date
        };
    } catch (error) {
        logger.error('Error converting to base currency:', error);
        throw error;
    }
}

export default {
    getExchangeRate,
    convertAmount,
    updateExchangeRate,
    getAllRates,
    getRateHistory,
    deactivateRate,
    initializeDefaultRates,
    convertToBaseCurrency,
    SUPPORTED_CURRENCIES,
    DEFAULT_CURRENCY
};
