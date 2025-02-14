import { useQuery, useMutation } from "@tanstack/react-query";
import { CartItem, Product } from "@shared/schema";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

type CartItemWithProduct = CartItem & { product: Product };

export default function CartPage() {
  const { toast } = useToast();
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixCode, setPixCode] = useState("");
  const [qrCode, setQrCode] = useState("");

  const { data: cartItems, isLoading: isLoadingCart } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest("DELETE", `/api/cart/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "The item has been removed from your cart.",
      });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payment/pix", {
        total: calculateTotal(),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setPixCode(data.pix_code);
      setQrCode(data.qr_code_base64);
      setPixModalOpen(true);
    },
    onError: () => {
      toast({
        title: "Payment error",
        description: "Failed to generate PIX payment code",
        variant: "destructive",
      });
    },
  });

  const calculateTotal = () => {
    if (!cartItems) return 0;
    return cartItems.reduce(
      (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
      0
    );
  };

  if (isLoadingCart) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

        {cartItems && cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </p>
                      <p className="font-medium">
                        R$ {parseFloat(item.product.price).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItemMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="h-fit">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-2">
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>R$ {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  className="w-full mt-6"
                  onClick={() => createPaymentMutation.mutate()}
                  disabled={createPaymentMutation.isPending}
                >
                  {createPaymentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Pay with PIX"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">Your cart is empty</p>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/"}
                className="mt-4"
              >
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={pixModalOpen} onOpenChange={setPixModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>PIX Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-center">
              <img
                src={`data:image/png;base64,${qrCode}`}
                alt="PIX QR Code"
                className="mx-auto"
              />
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm font-medium mb-2">PIX Code:</p>
                <p className="text-xs break-all">{pixCode}</p>
              </div>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(pixCode);
                  toast({
                    title: "Code copied",
                    description: "PIX code copied to clipboard",
                  });
                }}
              >
                Copy PIX Code
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
