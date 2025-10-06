"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface MenuCardProps {
  id?: number;
  name: string;
  category: 'food' | 'beverage' | 'snack';
  price: number;
  costPrice?: number;
  description?: string;
  image?: string;
  available: boolean;
  ingredients?: Array<{
    inventoryName: string;
    quantity: number | string;
    unit: string;
  }>;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleAvailability?: () => void;
}

export function MenuCard({
  name,
  category,
  price,
  costPrice,
  description,
  image,
  available,
  ingredients = [],
  onEdit,
  onDelete,
  onToggleAvailability,
}: MenuCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = image ? [image] : [];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <Card className="w-full max-w-sm overflow-hidden group bg-background text-foreground shadow-md hover:shadow-xl transition-all duration-300 rounded-lg relative">
      {/* Hover gradient effect */}
      <div className="opacity-0 group-hover:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-br from-green-50 to-transparent pointer-events-none z-0" />

      {/* Accent bar */}
      <div className="absolute left-0 top-0 h-1 w-0 group-hover:w-full bg-green-500 transition-all duration-300 z-10" />

      {/* Image carousel */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {images.length > 0 ? (
          <>
            <motion.img
              key={currentImageIndex}
              src={images[currentImageIndex]}
              alt={`${name} - View ${currentImageIndex + 1}`}
              className={`object-cover w-full h-full group-hover:scale-110 transition-transform duration-300 ${
                !available ? "grayscale" : ""
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />

            {/* Navigation arrows - only show if multiple images */}
            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Image indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentImageIndex ? "bg-white w-4" : "bg-white/50"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-sm">No Image</span>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="capitalize">
            {category}
          </Badge>
        </div>

        {/* Availability Badge */}
        <div className="absolute top-3 right-3">
          <Badge
            variant={available ? "default" : "destructive"}
            className={available ? "bg-green-500 hover:bg-green-600" : ""}
          >
            {available ? "Tersedia" : "Habis"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 relative z-10">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-green-600 transition-colors duration-200">
              {name}
            </h3>
            {description && (
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                {description}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(price)}
            </span>
            {costPrice && (
              <span className="text-xs text-gray-500">
                Modal: {formatCurrency(costPrice)}
              </span>
            )}
          </div>

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-700">Bahan:</div>
              <div className="space-y-0.5">
                {ingredients.slice(0, 3).map((ing: any, idx: number) => (
                  <p key={idx} className="text-xs text-gray-600">
                    • {ing.inventoryName} ({ing.quantity} {ing.unit})
                  </p>
                ))}
                {ingredients.length > 3 && (
                  <p className="text-xs text-gray-500 italic">
                    +{ingredients.length - 3} lainnya
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Footer */}
      <CardFooter className="p-4 pt-0 relative z-10">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAvailability}
            className={`flex-1 ${
              available
                ? "border-red-300 text-red-700 hover:bg-red-50"
                : "border-green-300 text-green-700 hover:bg-green-50"
            }`}
          >
            {available ? "Tandai Habis" : "Tandai Tersedia"}
          </Button>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
