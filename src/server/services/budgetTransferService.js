/**
 * Budget Transfer Service - Manage budget transfers between projects and activities
 * 
 * Handles:
 * - Budget transfer creation and validation
 * - Budget availability checks
 * - Transfer execution with audit trail
 * - Transfer reversal
 * - Transfer history and reporting
 * 
 * @module budgetTransferService
 */

import databaseService from './databaseService.js';
import currencyService from './currencyService.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Validate if source project has sufficient budget
 * @param {UUID} sourceProjectId - Source project ID
 * @param {number} amount - Amount to transfer
 * @param {string} currency - Currency of transfer
 * @returns {Promise<Object>} Validation result with available budget
 */
export async function validateTransfer(sourceProjectId, amount, currency = 'UGX') {
    try {
        // Get project details
        const projectQuery = `
            SELECT 
                id,
                name,
                budget,
                expenditure,
                (budget - expenditure) as available_budget
            FROM projects
            WHERE id = $1
        `;

        const projectResult = await databaseService.query(projectQuery, [sourceProjectId]);
        
        if (projectResult.rows.length === 0) {
            throw new AppError('Source project not found', 404);
        }

        const project = projectResult.rows[0];

        // Get total transfers out (already committed)
        const transfersQuery = `
            SELECT COALESCE(SUM(amount), 0) as total_transferred
            FROM activity_budget_transfers
            WHERE source_project_id = $1
                AND status = 'completed'
        `;

        const transfersResult = await databaseService.query(transfersQuery, [sourceProjectId]);
        const totalTransferred = parseFloat(transfersResult.rows[0].total_transferred);

        // Calculate truly available budget
        const availableBudget = parseFloat(project.budget) - parseFloat(project.expenditure) - totalTransferred;

        // Convert requested amount to project currency if needed
        let amountInProjectCurrency = amount;
        if (currency !== 'UGX') {
            const conversion = await currencyService.convertAmount(amount, currency, 'UGX');
            amountInProjectCurrency = conversion.convertedAmount;
        }

        const isValid = availableBudget >= amountInProjectCurrency;

        return {
            valid: isValid,
            project: {
                id: project.id,
                name: project.name,
                totalBudget: parseFloat(project.budget),
                expenditure: parseFloat(project.expenditure),
                totalTransferred,
                availableBudget
            },
            requestedAmount: amountInProjectCurrency,
            currency: 'UGX',
            message: isValid 
                ? 'Sufficient budget available' 
                : `Insufficient budget. Available: ${availableBudget}, Requested: ${amountInProjectCurrency}`
        };
    } catch (error) {
        logger.error('Error validating transfer:', error);
        throw error;
    }
}

/**
 * Create and execute budget transfer
 * @param {Object} transferData - Transfer details
 * @returns {Promise<Object>} Created transfer record
 */
export async function createTransfer(transferData) {
    const client = await databaseService.pool.connect();
    
    try {
        await client.query('BEGIN');

        const {
            sourceProjectId,
            destinationProjectId,
            destinationActivityId,
            amount,
            currency = 'UGX',
            reason,
            userId
        } = transferData;

        // Validate transfer
        const validation = await validateTransfer(sourceProjectId, amount, currency);
        if (!validation.valid) {
            throw new AppError(validation.message, 400);
        }

        // Validate destination activity belongs to destination project
        const activityCheck = await client.query(
            'SELECT id, project_id, budget FROM activities WHERE id = $1',
            [destinationActivityId]
        );

        if (activityCheck.rows.length === 0) {
            throw new AppError('Destination activity not found', 404);
        }

        if (activityCheck.rows[0].project_id !== destinationProjectId) {
            throw new AppError('Activity does not belong to destination project', 400);
        }

        // Convert amount to UGX if needed
        let amountUGX = amount;
        let exchangeRate = 1;
        if (currency !== 'UGX') {
            const conversion = await currencyService.convertAmount(amount, currency, 'UGX');
            amountUGX = conversion.convertedAmount;
            exchangeRate = conversion.exchangeRate;
        }

        // Create transfer record
        const transferQuery = `
            INSERT INTO activity_budget_transfers (
                source_project_id,
                destination_project_id,
                destination_activity_id,
                amount,
                currency,
                exchange_rate,
                amount_ugx,
                reason,
                status,
                transfer_date,
                created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed', CURRENT_TIMESTAMP, $9)
            RETURNING *
        `;

        const transferResult = await client.query(transferQuery, [
            sourceProjectId,
            destinationProjectId,
            destinationActivityId,
            amount,
            currency,
            exchangeRate,
            amountUGX,
            reason,
            userId
        ]);

        const transfer = transferResult.rows[0];

        // Update activity budget
        const currentBudget = parseFloat(activityCheck.rows[0].budget) || 0;
        const newBudget = currentBudget + amountUGX;

        await client.query(
            'UPDATE activities SET budget = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newBudget, destinationActivityId]
        );

        // Note: We don't reduce source project budget directly
        // It's tracked through the transfers table for audit purposes
        // The available budget calculation considers transfers out

        await client.query('COMMIT');

        logger.info(`Budget transfer completed: ${transfer.id} (${amount} ${currency} = ${amountUGX} UGX)`);

        return {
            ...transfer,
            validation: validation.project
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error creating transfer:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Get transfer history for a project
 * @param {UUID} projectId - Project ID
 * @param {string} direction - 'in', 'out', or 'both'
 * @returns {Promise<Array>} Transfer history
 */
export async function getProjectTransferHistory(projectId, direction = 'both') {
    try {
        let query;
        let params;

        if (direction === 'out') {
            query = `
                SELECT 
                    t.*,
                    sp.name as source_project_name,
                    dp.name as destination_project_name,
                    a.activity_name
                FROM activity_budget_transfers t
                LEFT JOIN projects sp ON t.source_project_id = sp.id
                LEFT JOIN projects dp ON t.destination_project_id = dp.id
                LEFT JOIN activities a ON t.destination_activity_id = a.id
                WHERE t.source_project_id = $1
                ORDER BY t.transfer_date DESC
            `;
            params = [projectId];
        } else if (direction === 'in') {
            query = `
                SELECT 
                    t.*,
                    sp.name as source_project_name,
                    dp.name as destination_project_name,
                    a.activity_name
                FROM activity_budget_transfers t
                LEFT JOIN projects sp ON t.source_project_id = sp.id
                LEFT JOIN projects dp ON t.destination_project_id = dp.id
                LEFT JOIN activities a ON t.destination_activity_id = a.id
                WHERE t.destination_project_id = $1
                ORDER BY t.transfer_date DESC
            `;
            params = [projectId];
        } else {
            query = `
                SELECT 
                    t.*,
                    sp.name as source_project_name,
                    dp.name as destination_project_name,
                    a.activity_name,
                    CASE 
                        WHEN t.source_project_id = $1 THEN 'out'
                        WHEN t.destination_project_id = $1 THEN 'in'
                    END as direction
                FROM activity_budget_transfers t
                LEFT JOIN projects sp ON t.source_project_id = sp.id
                LEFT JOIN projects dp ON t.destination_project_id = dp.id
                LEFT JOIN activities a ON t.destination_activity_id = a.id
                WHERE t.source_project_id = $1 OR t.destination_project_id = $1
                ORDER BY t.transfer_date DESC
            `;
            params = [projectId];
        }

        const result = await databaseService.query(query, params);
        return result.rows;
    } catch (error) {
        logger.error('Error getting project transfer history:', error);
        throw error;
    }
}

/**
 * Get transfer history for an activity
 * @param {UUID} activityId - Activity ID
 * @returns {Promise<Array>} Transfer history
 */
export async function getActivityTransferHistory(activityId) {
    try {
        const query = `
            SELECT 
                t.*,
                sp.name as source_project_name,
                dp.name as destination_project_name,
                a.activity_name
            FROM activity_budget_transfers t
            LEFT JOIN projects sp ON t.source_project_id = sp.id
            LEFT JOIN projects dp ON t.destination_project_id = dp.id
            LEFT JOIN activities a ON t.destination_activity_id = a.id
            WHERE t.destination_activity_id = $1
            ORDER BY t.transfer_date DESC
        `;

        const result = await databaseService.query(query, [activityId]);
        return result.rows;
    } catch (error) {
        logger.error('Error getting activity transfer history:', error);
        throw error;
    }
}

/**
 * Reverse a transfer (rollback)
 * @param {UUID} transferId - Transfer ID to reverse
 * @param {string} reason - Reason for reversal
 * @param {UUID} userId - User requesting reversal
 * @returns {Promise<Object>} Reversed transfer
 */
export async function reverseTransfer(transferId, reason, userId) {
    const client = await databaseService.pool.connect();
    
    try {
        await client.query('BEGIN');

        // Get original transfer
        const transferQuery = 'SELECT * FROM activity_budget_transfers WHERE id = $1';
        const transferResult = await client.query(transferQuery, [transferId]);

        if (transferResult.rows.length === 0) {
            throw new AppError('Transfer not found', 404);
        }

        const transfer = transferResult.rows[0];

        if (transfer.status === 'reversed') {
            throw new AppError('Transfer already reversed', 400);
        }

        if (transfer.status !== 'completed') {
            throw new AppError('Can only reverse completed transfers', 400);
        }

        // Update activity budget (subtract the transfer amount)
        const activityQuery = 'SELECT budget FROM activities WHERE id = $1';
        const activityResult = await client.query(activityQuery, [transfer.destination_activity_id]);
        
        if (activityResult.rows.length === 0) {
            throw new AppError('Destination activity not found', 404);
        }

        const currentBudget = parseFloat(activityResult.rows[0].budget);
        const amountUGX = parseFloat(transfer.amount_ugx);
        const newBudget = currentBudget - amountUGX;

        if (newBudget < 0) {
            throw new AppError('Cannot reverse: would result in negative activity budget', 400);
        }

        await client.query(
            'UPDATE activities SET budget = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newBudget, transfer.destination_activity_id]
        );

        // Update transfer status
        await client.query(
            `UPDATE activity_budget_transfers 
             SET status = 'reversed', 
                 reversal_reason = $1, 
                 reversed_at = CURRENT_TIMESTAMP,
                 reversed_by = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [reason, userId, transferId]
        );

        await client.query('COMMIT');

        logger.info(`Transfer reversed: ${transferId}`);

        return {
            ...transfer,
            status: 'reversed',
            reversal_reason: reason,
            reversed_by: userId
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error reversing transfer:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Generate transfer report for a project
 * @param {UUID} projectId - Project ID
 * @param {Date} startDate - Start date for report
 * @param {Date} endDate - End date for report
 * @returns {Promise<Object>} Transfer report
 */
export async function generateTransferReport(projectId, startDate, endDate = new Date()) {
    try {
        const query = `
            SELECT 
                COUNT(*) FILTER (WHERE source_project_id = $1 AND status = 'completed') as transfers_out_count,
                COALESCE(SUM(amount_ugx) FILTER (WHERE source_project_id = $1 AND status = 'completed'), 0) as total_out,
                COUNT(*) FILTER (WHERE destination_project_id = $1 AND status = 'completed') as transfers_in_count,
                COALESCE(SUM(amount_ugx) FILTER (WHERE destination_project_id = $1 AND status = 'completed'), 0) as total_in,
                COUNT(*) FILTER (WHERE (source_project_id = $1 OR destination_project_id = $1) AND status = 'reversed') as reversed_count
            FROM activity_budget_transfers
            WHERE (source_project_id = $1 OR destination_project_id = $1)
                AND transfer_date BETWEEN $2 AND $3
        `;

        const result = await databaseService.query(query, [projectId, startDate, endDate]);
        const stats = result.rows[0];

        const totalOut = parseFloat(stats.total_out);
        const totalIn = parseFloat(stats.total_in);
        const netPosition = totalIn - totalOut;

        return {
            projectId,
            reportPeriod: {
                startDate,
                endDate
            },
            transfersOut: {
                count: parseInt(stats.transfers_out_count),
                total: totalOut
            },
            transfersIn: {
                count: parseInt(stats.transfers_in_count),
                total: totalIn
            },
            netPosition,
            reversedCount: parseInt(stats.reversed_count),
            currency: 'UGX'
        };
    } catch (error) {
        logger.error('Error generating transfer report:', error);
        throw error;
    }
}

/**
 * Get transfer details by ID
 * @param {UUID} transferId - Transfer ID
 * @returns {Promise<Object>} Transfer details
 */
export async function getTransferById(transferId) {
    try {
        const query = `
            SELECT 
                t.*,
                sp.name as source_project_name,
                dp.name as destination_project_name,
                a.activity_name,
                u_created.full_name as created_by_name,
                u_reversed.full_name as reversed_by_name
            FROM activity_budget_transfers t
            LEFT JOIN projects sp ON t.source_project_id = sp.id
            LEFT JOIN projects dp ON t.destination_project_id = dp.id
            LEFT JOIN activities a ON t.destination_activity_id = a.id
            LEFT JOIN users u_created ON t.created_by = u_created.id
            LEFT JOIN users u_reversed ON t.reversed_by = u_reversed.id
            WHERE t.id = $1
        `;

        const result = await databaseService.query(query, [transferId]);
        
        if (result.rows.length === 0) {
            throw new AppError('Transfer not found', 404);
        }

        return result.rows[0];
    } catch (error) {
        logger.error('Error getting transfer by ID:', error);
        throw error;
    }
}

export default {
    validateTransfer,
    createTransfer,
    getProjectTransferHistory,
    getActivityTransferHistory,
    reverseTransfer,
    generateTransferReport,
    getTransferById
};
