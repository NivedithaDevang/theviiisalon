import { Request, Response, NextFunction } from "express";

import {
    getAllCustomers,
    getCustomerById,
    getCustomerBookings,
    searchCustomers
} from "../model/customerModel.js";

export const fetchCustomers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const customers = await getAllCustomers();

        res.status(200).json({
            success: true,
            data: customers
        });
    } catch (error) {
        next(error);
    }
};

export const fetchCustomerDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
            return;
        }

        const customer = await getCustomerById(id);

        if (!customer) {
            res.status(404).json({
                success: false,
                message: "Customer not found"
            });
            return;
        }

        const bookings = await getCustomerBookings(id);

        res.status(200).json({
            success: true,
            data: { customer, bookings }
        });
    } catch (error) {
        next(error);
    }
};

export const searchCustomerRecords = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const search = String(req.query.search || "").trim();

        if (!search) {
            res.status(400).json({
                success: false,
                message: "Search value is required"
            });
            return;
        }

        const customers = await searchCustomers(search);

        res.status(200).json({
            success: true,
            data: customers
        });
    } catch (error) {
        next(error);
    }
};