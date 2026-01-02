import { BadRequestException } from '@nestjs/common';

/**
 * Valider et décoder une signature base64
 */
export function validateSignatureSize(
  signature: string,
  maxSizeKB: number = 100,
): { imageBuffer: Buffer; sizeKB: number } {
  try {
    // Extraire la partie base64
    const parts = signature.split(',');

    if (parts.length !== 2) {
      throw new BadRequestException('Format de signature invalide (pas de virgule)');
    }

    const [header, base64Data] = parts;

    // Vérifier le header
    if (!header.startsWith('data:image/')) {
      throw new BadRequestException('Format de signature invalide (pas une image)');
    }

    // Décoder le base64
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const sizeKB = imageBuffer.length / 1024;

    // Vérifier la taille
    if (sizeKB > maxSizeKB) {
      throw new BadRequestException(
        `La signature est trop volumineuse (${sizeKB.toFixed(1)} KB). Maximum : ${maxSizeKB} KB`,
      );
    }

    return { imageBuffer, sizeKB };
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException('Format de signature invalide ou corrompue');
  }
}

/**
 * Extraire le format d'image depuis le header base64
 */
export function extractImageFormat(signature: string): 'png' | 'jpg' | 'jpeg' | null {
  const match = signature.match(/data:image\/(png|jpeg|jpg);base64,/);
  return match ? (match[1] as 'png' | 'jpg' | 'jpeg') : null;
}
