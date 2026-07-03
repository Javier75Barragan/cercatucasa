import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = Router();

// Extensiones permitidas (whitelist estricta)
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

// Magic bytes de los tipos de imagen permitidos
const MAGIC_BYTES: Record<string, Buffer[]> = {
  '.jpg': [Buffer.from([0xff, 0xd8, 0xff])],
  '.jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  '.png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  '.gif': [Buffer.from([0x47, 0x49, 0x46, 0x38])],
  '.webp': [Buffer.from([0x52, 0x49, 0x46, 0x46])],
};

// Asegurar que el directorio de uploads existe
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Almacenamiento en memoria primero para poder validar magic bytes antes de escribir al disco
const storage = multer.memoryStorage();

// Filtro: solo imágenes por extensión y MIME type (primera capa)
const fileFilter = (_req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error('Extensión no permitida. Solo: jpg, jpeg, png, webp, gif'), false);
  }
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Tipo MIME inválido. Solo se permiten imágenes.'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * Valida los magic bytes del buffer para detectar MIME spoofing.
 * Protege contra ataques XSS/RCE donde se sube un archivo malicioso con extensión .jpg.
 */
function validateMagicBytes(buffer: Buffer, ext: string): boolean {
  const signatures = MAGIC_BYTES[ext];
  if (!signatures) return false;
  return signatures.some((sig) => buffer.slice(0, sig.length).equals(sig));
}

// Ruta de subida
router.post(
  '/',
  authenticate,
  upload.single('image'),
  (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se subió ninguna imagen',
      } as ApiResponse<null>);
    }

    const ext = path.extname(req.file.originalname).toLowerCase();

    // Segunda capa de seguridad: validar magic bytes para prevenir MIME spoofing
    if (!validateMagicBytes(req.file.buffer, ext)) {
      return res.status(400).json({
        success: false,
        error: 'El contenido del archivo no corresponde a una imagen válida.',
      } as ApiResponse<null>);
    }

    // Generar nombre seguro sin usar ningún dato del nombre original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeFilename = `img-${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, safeFilename);

    // Escribir al disco solo después de pasar todas las validaciones
    fs.writeFileSync(filePath, req.file.buffer);

    const protocol = req.protocol;
    const host = req.get('host');
    const url = `${protocol}://${host}/uploads/${safeFilename}`;

    const response: ApiResponse<{ url: string }> = {
      success: true,
      data: { url },
      message: 'Imagen subida exitosamente',
    };

    res.status(201).json(response);
  }
);

export default router;
