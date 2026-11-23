import { Request, Response } from "express";
import { serviceModel, ServiceInput } from "../model/serviceModel.js";
import { FALLBACK_SERVICES } from "../utils/defaultServices.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseServiceInput(body: unknown): { data?: ServiceInput; error?: string } {
  if (!isRecord(body)) {
    return { error: "A service object is required." };
  }

  const { categoryId, name, price, duration, description, isActive } = body;
  if (!Number.isInteger(categoryId) || Number(categoryId) < 1) {
    return { error: "Choose a valid service category." };
  }
  if (typeof name !== "string" || !name.trim() || name.trim().length > 180) {
    return { error: "Service name must be between 1 and 180 characters." };
  }
  if (
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > 99_999_999.99
  ) {
    return { error: "Enter a valid service price." };
  }
  if (!Number.isInteger(duration) || Number(duration) < 1 || Number(duration) > 65_535) {
    return { error: "Duration must be a whole number between 1 and 65535 minutes." };
  }
  if (typeof description !== "string") {
    return { error: "Service description must be text." };
  }
  if (isActive !== undefined && typeof isActive !== "boolean") {
    return { error: "Service visibility must be a boolean." };
  }

  return {
    data: {
      categoryId: Number(categoryId),
      name: name.trim(),
      price: Math.round(price * 100) / 100,
      duration: Number(duration),
      description: description.trim(),
      isActive: true,
    },
  };
}

function parseId(value: unknown): number | null {
  if (typeof value !== "string") return null;
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export const getServices = async (_req: Request, res: Response): Promise<void> => {
  try {
    const services = await serviceModel.getAllServices();
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    console.warn("Database unavailable, serving published catalog services:", error);
    res.status(200).json({ success: true, data: FALLBACK_SERVICES });
  }
};

export const getAdminServices = async (_req: Request, res: Response): Promise<void> => {
  try {
    const services = await serviceModel.getAllAdminServices();
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    console.error("Get admin services error:", error);
    res.status(500).json({ success: false, message: "Failed to load services." });
  }
};

export const getServiceCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await serviceModel.getActiveCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error("Get service categories error:", error);
    res.status(500).json({ success: false, message: "Failed to load service categories." });
  }
};

export const createService = async (req: Request, res: Response): Promise<void> => {
  const parsed = parseServiceInput(req.body);
  if (!parsed.data) {
    res.status(400).json({ success: false, message: parsed.error });
    return;
  }

  try {
    if (!(await serviceModel.hasActiveCategory(parsed.data.categoryId))) {
      res.status(400).json({ success: false, message: "Choose an active service category." });
      return;
    }

    const id = await serviceModel.createService(parsed.data);
    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_SERVICE") {
      res.status(409).json({
        success: false,
        message: "An active service with this name already exists in this category.",
      });
      return;
    }
    console.error("Create service error:", error);
    res.status(500).json({ success: false, message: "Failed to create service." });
  }
};

export const updateService = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ success: false, message: "A valid service ID is required." });
    return;
  }

  const parsed = parseServiceInput(req.body);
  if (!parsed.data) {
    res.status(400).json({ success: false, message: parsed.error });
    return;
  }

  try {
    if (!(await serviceModel.serviceExists(id))) {
      res.status(404).json({ success: false, message: "Service not found." });
      return;
    }
    if (!(await serviceModel.hasActiveCategory(parsed.data.categoryId))) {
      res.status(400).json({ success: false, message: "Choose an active service category." });
      return;
    }

    await serviceModel.updateService(id, parsed.data);
    res.status(200).json({ success: true, message: "Service updated." });
  } catch (error) {
    console.error("Update service error:", error);
    res.status(500).json({ success: false, message: "Failed to update service." });
  }
};

export const removeService = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ success: false, message: "A valid service ID is required." });
    return;
  }

  try {
    if (!(await serviceModel.serviceExists(id))) {
      res.status(404).json({ success: false, message: "Service not found." });
      return;
    }

    await serviceModel.deleteService(id);
    res.status(200).json({ success: true, message: "Service permanently deleted." });
  } catch (error) {
    console.error("Remove service error:", error);
    res.status(500).json({ success: false, message: "Failed to remove service." });
  }
};