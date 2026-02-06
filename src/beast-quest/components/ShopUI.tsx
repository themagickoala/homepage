// ============================================
// Shop UI Component
// ============================================
// Buy/sell interface for village shops

import { useEffect, useState, useCallback } from 'react'
import { ShopData, InventorySlot, Item } from '../types'
import { ITEMS } from '../data/items'
import './ShopUI.css'

interface ShopUIProps {
  shop: ShopData
  inventory: InventorySlot[]
  gold: number
  onBuy: (itemId: string) => void
  onSell: (itemId: string) => void
  onClose: () => void
}

type ShopTab = 'buy' | 'sell'

export function ShopUI({ shop, inventory, gold, onBuy, onSell, onClose }: ShopUIProps) {
  const [activeTab, setActiveTab] = useState<ShopTab>('buy')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [message, setMessage] = useState<string | null>(null)

  // Get items for current tab
  const buyItems = shop.items
    .map((si) => ({ shopItem: si, item: ITEMS[si.itemId] }))
    .filter((entry) => entry.item && (entry.shopItem.stock === -1 || entry.shopItem.stock > 0))

  const sellItems = inventory.filter(
    (slot) => slot.item.type !== 'key' && slot.quantity > 0
  )

  const currentList = activeTab === 'buy' ? buyItems : sellItems
  const selectedEntry = currentList[selectedIndex]

  // Get the selected item for details panel
  const selectedItem: Item | null =
    activeTab === 'buy'
      ? (selectedEntry as (typeof buyItems)[number])?.item ?? null
      : (selectedEntry as InventorySlot)?.item ?? null

  const buyPrice = selectedItem?.value ?? 0
  const sellPrice = selectedItem ? Math.floor(selectedItem.value / 2) : 0

  // Reset selection when switching tabs
  useEffect(() => {
    setSelectedIndex(0)
    setMessage(null)
  }, [activeTab])

  // Clear message after delay
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleConfirm = useCallback(() => {
    if (!selectedItem) return

    if (activeTab === 'buy') {
      if (gold < buyPrice) {
        setMessage("Not enough gold!")
        return
      }
      onBuy(selectedItem.id)
      setMessage(`Bought ${selectedItem.name}!`)
    } else {
      onSell(selectedItem.id)
      setMessage(`Sold ${selectedItem.name} for ${sellPrice}g!`)
      // Adjust index if we sold the last item
      if (selectedIndex >= sellItems.length - 1 && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1)
      }
    }
  }, [activeTab, selectedItem, gold, buyPrice, sellPrice, onBuy, onSell, selectedIndex, sellItems.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((i) => Math.max(0, i - 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((i) => Math.min(currentList.length - 1, i + 1))
          break
        case 'ArrowLeft':
          e.preventDefault()
          setActiveTab('buy')
          break
        case 'ArrowRight':
          e.preventDefault()
          setActiveTab('sell')
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          handleConfirm()
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentList.length, handleConfirm, onClose])

  return (
    <div className="shop-overlay">
      <div className="shop-panel">
        {/* Header */}
        <div className="shop-header">
          <h2>{shop.name}</h2>
          <span className="shop-gold">{gold}g</span>
        </div>

        {/* Tabs */}
        <div className="shop-tabs">
          <button
            className={`tab ${activeTab === 'buy' ? 'active' : ''}`}
            onClick={() => setActiveTab('buy')}
          >
            Buy
          </button>
          <button
            className={`tab ${activeTab === 'sell' ? 'active' : ''}`}
            onClick={() => setActiveTab('sell')}
          >
            Sell
          </button>
        </div>

        {/* Content */}
        <div className="shop-content">
          {/* Item list */}
          <div className="shop-list">
            {currentList.length === 0 ? (
              <div className="shop-empty">
                {activeTab === 'buy' ? 'Nothing for sale' : 'Nothing to sell'}
              </div>
            ) : (
              currentList.map((entry, i) => {
                const item = activeTab === 'buy'
                  ? (entry as (typeof buyItems)[number]).item
                  : (entry as InventorySlot).item
                const price = activeTab === 'buy' ? item.value : Math.floor(item.value / 2)
                const canAfford = activeTab === 'buy' ? gold >= price : true
                const quantity = activeTab === 'sell'
                  ? (entry as InventorySlot).quantity
                  : undefined

                return (
                  <div
                    key={`${item.id}-${i}`}
                    className={`shop-item-row ${i === selectedIndex ? 'selected' : ''} ${!canAfford ? 'unaffordable' : ''}`}
                    onClick={() => setSelectedIndex(i)}
                    onDoubleClick={handleConfirm}
                  >
                    <span>
                      <span className="shop-item-name">{item.name}</span>
                      {quantity !== undefined && quantity > 1 && (
                        <span className="shop-item-quantity">x{quantity}</span>
                      )}
                    </span>
                    <span className="shop-item-price">{price}g</span>
                  </div>
                )
              })
            )}
          </div>

          {/* Details panel */}
          <div className="shop-details">
            {selectedItem ? (
              <>
                <h3>{selectedItem.name}</h3>
                <div className="item-description">{selectedItem.description}</div>
                {selectedItem.equipStats && (
                  <div className="equip-stats">
                    {selectedItem.equipStats.attack !== undefined && selectedItem.equipStats.attack !== 0 && (
                      <div className="stat-bonus">ATK +{selectedItem.equipStats.attack}</div>
                    )}
                    {selectedItem.equipStats.defense !== undefined && selectedItem.equipStats.defense !== 0 && (
                      <div className="stat-bonus">DEF +{selectedItem.equipStats.defense}</div>
                    )}
                    {selectedItem.equipStats.speed !== undefined && selectedItem.equipStats.speed !== 0 && (
                      <div className="stat-bonus">SPD +{selectedItem.equipStats.speed}</div>
                    )}
                    {selectedItem.equipStats.maxHp !== undefined && selectedItem.equipStats.maxHp !== 0 && (
                      <div className="stat-bonus">HP +{selectedItem.equipStats.maxHp}</div>
                    )}
                    {selectedItem.equipStats.maxMp !== undefined && selectedItem.equipStats.maxMp !== 0 && (
                      <div className="stat-bonus">MP +{selectedItem.equipStats.maxMp}</div>
                    )}
                  </div>
                )}
                <div className="shop-price-info">
                  {activeTab === 'buy'
                    ? `Price: ${buyPrice}g`
                    : `Sell for: ${sellPrice}g`}
                </div>
              </>
            ) : (
              <div className="no-selection">Select an item to view details</div>
            )}
          </div>
        </div>

        {/* Message */}
        {message && <div className="shop-message">{message}</div>}

        {/* Footer */}
        <div className="shop-footer">
          ↑↓ Navigate | ←→ Switch Tab | Enter: Confirm | Esc: Close
        </div>
      </div>
    </div>
  )
}
