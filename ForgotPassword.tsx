import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../CartContext';
import { formatCurrency } from '../utils';
import { Button } from '../components/Button';

export const Cart = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6 px-6 pt-20">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-ink">Your cart is empty</h2>
        </div>
        <Link to="/shop">
          <button className="bg-ink text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-ink/90 transition-colors">
            Continue shopping
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-ink/10 pb-4">
          <h1 className="text-4xl font-bold tracking-tight text-ink">
            Your cart
          </h1>
          <Link to="/shop" className="text-sm underline underline-offset-4 text-ink hover:text-ink/70 mt-4 md:mt-0">
            Continue shopping
          </Link>
        </div>

        <div className="hidden md:grid grid-cols-12 gap-4 text-[10px] tracking-[0.2em] uppercase text-ink/40 font-bold border-b border-ink/5 pb-4 mb-8">
          <div className="col-span-6">Product</div>
          <div className="col-span-3 text-center">Quantity</div>
          <div className="col-span-3 text-right">Total</div>
        </div>

        <div className="space-y-8 mb-12">
          {cart.map((item) => (
            <div
              key={item.cartKey || item.productId}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-4 items-center border-b border-ink/5 pb-8 last:border-0"
            >
              {/* Product Info */}
              <div className="col-span-1 md:col-span-6 flex items-start space-x-6">
                <div className="w-24 aspect-square bg-white border border-ink/5 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-semibold text-ink hover:text-ink/70 transition-colors cursor-pointer">
                    {item.name}
                  </h3>
                  {item.variantName && (
                    <p className="text-[10px] uppercase tracking-widest text-ink/40 font-bold">
                      Color: {item.variantName}
                    </p>
                  )}
                  <p className="text-sm text-ink/60">{formatCurrency(item.price)}</p>
                </div>
              </div>

              {/* Quantity */}
              <div className="col-span-1 md:col-span-3 flex justify-start md:justify-center items-center">
                <div className="flex items-center border border-ink/20 w-max">
                  <button
                    onClick={() => updateQuantity(item.cartKey || item.productId, item.quantity - 1)}
                    className="p-3 text-ink/60 hover:text-ink transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartKey || item.productId, item.quantity + 1)}
                    className="p-3 text-ink/60 hover:text-ink transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.cartKey || item.productId)}
                  className="ml-6 p-2 text-ink/40 hover:text-red-500 transition-colors md:hidden"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Total */}
              <div className="hidden md:flex col-span-3 justify-end items-center space-x-8">
                <button
                  onClick={() => removeFromCart(item.cartKey || item.productId)}
                  className="p-2 text-ink/40 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <p className="text-sm font-medium text-ink min-w-[100px] text-right">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center md:items-end space-y-6 pt-8">
          <div className="flex flex-col items-center md:items-end space-y-3">
            <div className="flex items-center space-x-8">
              <span className="text-xl font-normal text-ink/80">Subtotal</span>
              <span className="text-xl text-ink font-bold">{formatCurrency(totalPrice)}</span>
            </div>
            <p className="text-sm text-ink/60 text-center md:text-right">
              Taxes and shipping calculated at checkout
            </p>
          </div>

          <Link to="/checkout" className="w-full md:w-96 mt-4 inline-block">
            <button className="w-full bg-ink text-white py-4 text-center font-bold tracking-widest uppercase hover:bg-ink/90 transition-colors">
              Check out
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
