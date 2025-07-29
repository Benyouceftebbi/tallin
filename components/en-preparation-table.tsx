"use client"

import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import {
  CheckCircle,
  MoreHorizontal,
  Package,
  Search,
  Edit,
  ArrowRight,
  Filter,
  Barcode,
  Truck,
  User,
  Columns,
  X,
  Printer,
  CameraOff,
  Camera,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useShop, type Order, type DeliveryType } from "@/context/shop-context"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { DateRange } from "@/components/date-range-picker"
import { isWithinInterval, parseISO } from "date-fns"
import { httpsCallable } from "firebase/functions"
import { functions } from "@/lib/firebase"
import { generateParcelLabel } from "@/app/admin/commandes/confirmes/print"
import { PDFDocument } from 'pdf-lib';
import { useAuth } from "@/context/auth-context"
import { useOrderSearchParams } from "@/hooks/use-search-params"
import { HoverCard, HoverCardContent, HoverCardTrigger} from "./ui/hover-card"
import Quagga from "quagga"
// Liste des livreurs disponibles - définie en dehors du composant car elle ne change pas
const deliverymen = [
  "Ahmed Benali",
  "Mohamed Cherif",
  "Karim Hadj",
  "Sofiane Mebarki",
  "Yacine Boudiaf",
  "Farid Mansouri",
  "Hamza Bouzidi",
  "Omar Khelifi",
  "Reda Benmoussa",
  "Amine Taleb",
]

// Type pour le mode de scan
type ScanMode = "delivery_company" | "assign_deliveryman" | "dispatch_deliveryman" | null

// Type pour les colonnes visibles
type VisibleColumns = {
  [key: string]: boolean
}

// Utility functions for audio feedback
const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1)

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.2)
  } catch (error) {
    console.error("Error playing success sound:", error)
  }
}

const playAlertSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.type = "square"
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime + 0.1)
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.2)

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch (error) {
    console.error("Error playing alert sound:", error)
  }
}

const playWarningSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.type = "triangle"
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(330, audioContext.currentTime + 0.3)

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.4)
  } catch (error) {
    console.error("Error playing warning sound:", error)
  }
}

export default function EnPreparationTable() {
  const { getOrdersByStatus, updateOrder, updateMultipleOrdersStatus, loading,deliveryMen,   deliveryCompanies,workers} = useShop()
      const confirmatrices = workers.filter(w=>w.role==='Confirmatrice').map(c=>c.name)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDeliveryman, setSelectedDeliveryman] = useState<string>("")
  const [barcodeValue, setBarcodeValue] = useState("")
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const deliverymen = deliveryMen?deliveryMen?.map(d=>d.name).map(d=>d.name):[]
  // Nouveaux états pour le mode de scan
  const [scanMode, setScanMode] = useState<ScanMode>(null)
  const [isScanModeDialogOpen, setIsScanModeDialogOpen] = useState(false)
  const [selectedDeliveryCompany, setSelectedDeliveryCompany] = useState<string>("")
  const [scannedOrders, setScannedOrders] = useState<Order[]>([])
  const [trackingId, setTrackingId] = useState<string>("")
const searchFilters = useOrderSearchParams()
const [searchTerm, setSearchTerm] = useState(
  searchFilters.searchId ||
    searchFilters.searchName ||
    searchFilters.searchPhone ||
    searchFilters.searchTrackingId ||
    "",
)
  const [selectedConfirmatrice, setSelectedConfirmatrice] = useState("")
  const [isConfirmatriceModalOpen, setIsConfirmatriceModalOpen] = useState(false)
  const [confirmatriceFilter, setConfirmatriceFilter] = useState<string>("all")

  useEffect(() => {
  const urlSearchTerm =
    searchFilters.searchId ||
    searchFilters.searchName ||
    searchFilters.searchPhone ||
    searchFilters.searchTrackingId ||
    ""
  if (urlSearchTerm) {
    setSearchTerm(urlSearchTerm)
  }
}, [searchFilters])
  // État pour les colonnes visibles
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
    id: true,
    date: true,
    name: true,
    phone: true,
    articles: true,
    wilaya: true,
    commune: true,
    deliveryType: true,
    deliveryCompany: true,
    pickupPoint: true,
    deliveryPrice: true,
    address: true,
    totalPrice: true,
    source: true,
    confirmatrice:true
  })

  // Filtres
  const [deliveryCompanyFilter, setDeliveryCompanyFilter] = useState<string>("all")
const {workerName}=useAuth()
  // Obtenir les commandes en préparation - mémorisé pour éviter des appels inutiles
  const order1 = useMemo(() => getOrdersByStatus("En préparation"), [getOrdersByStatus])
    const orders = useMemo(() => {
      if (workerName) {
        return order1.filter((order) =>order.confirmatrice === workerName)
      } else {
        return order1
      }
    }, [order1, workerName])
const deliveryCompaniess = useMemo(() => {
  return Array.from(
    new Set(
      orders
        .map((order) => order.deliveryCompany)
        .filter((company) => company && company.trim() !== "")
    )
  );
}, [orders]);

  


  // Filtrer les commandes en fonction du terme de recherche et des filtres - mémorisé
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.wilaya.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.commune.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDeliveryCompany = deliveryCompanyFilter === "all" || order.deliveryCompany === deliveryCompanyFilter
      const matchesConfirmatrice = confirmatriceFilter === "all" || order.confirmatrice === confirmatriceFilter

      // Date range filter
      let matchesDateRange = true
      if (dateRange) {
        try {
          const orderDate = parseISO(order.date)
          matchesDateRange = isWithinInterval(orderDate, {
            start: dateRange.from,
            end: dateRange.to,
          })
        } catch (error) {
          // If date parsing fails, we'll still include the order
          console.error("Error parsing date:", error)
        }
      }

      return matchesSearch && matchesDeliveryCompany && matchesDateRange && matchesConfirmatrice
    })
  }, [orders, searchTerm, deliveryCompanyFilter, dateRange])

  // Focus sur l'input de code-barres au chargement
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [])

  // Gérer la sélection de toutes les lignes - mémorisé
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedRows(filteredOrders.map((order) => order.id))
      } else {
        setSelectedRows([])
      }
    },
    [filteredOrders],
  )

  // Gérer la sélection d'une ligne - mémorisé
  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows((prev) => [...prev, id])
    } else {
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id))
    }
  }, [])

  // Déplacer les commandes sélectionnées vers "Dispatcher" - mémorisé
  const moveToDispatcher = useCallback(() => {
    if (selectedRows.length === 0) {
      toast({
        title: "Aucune commande sélectionnée",
        description: "Veuillez sélectionner au moins une commande à déplacer.",
        variant: "destructive",
      })
      return
    }

    updateMultipleOrdersStatus(selectedRows, "Dispatcher")
    toast({
      title: "Commandes déplacées",
      description: `${selectedRows.length} commande(s) déplacée(s) vers "Dispatcher".`,
    })
    setSelectedRows([])
  }, [selectedRows, updateMultipleOrdersStatus])

  // Déplacer les commandes sélectionnées vers "Confirmés" - mémorisé
const moveBack = useCallback(async () => {
  if (selectedRows.length === 0) {
    toast({
      title: "Aucune commande sélectionnée",
      description: "Veuillez sélectionner au moins une commande à déplacer.",
      variant: "destructive",
    });
    return;
  }

  const deleteParcels = httpsCallable(functions, "deleteParcels");

  // Group selected orders by deliveryCompany
  const groupedByCompany: Record<string, string[]> = {};

  selectedRows.forEach((selectedId) => {
    const order = orders.find(o => o.id === selectedId);
    if (!order) return;

    const company = order.deliveryCompany || "unknown";
    if (!groupedByCompany[company]) {
      groupedByCompany[company] = [];
    }
    groupedByCompany[company].push(order.trackingId);
  });

  // Loop through each group and delete parcels with correct API keys
  for (const company in groupedByCompany) {
    const trackingIds = groupedByCompany[company];
    const deliveryKeys = deliveryCompanies.find(d => d.entity === company);

    if (!deliveryKeys) {
      console.warn(`Missing credentials for ${company}`);
      continue;
    }

    try {
      const response = await deleteParcels({
        trackingIds,
        apiId: deliveryKeys.apiId,
        apiToken: deliveryKeys.apiToken,
      });

      console.log(`Deleted parcels for ${company}:`, response.data);
    } catch (error) {
      console.error(`Failed to delete parcels for ${company}:`, error);
    }
  }

  // Update Firestore status for all selected orders
  updateMultipleOrdersStatus(selectedRows, "Confirmé");

  toast({
    title: "Commandes déplacées",
    description: `${selectedRows.length} commande(s) déplacée(s) vers "Confirmés".`,
  });

  setSelectedRows([]);
}, [selectedRows, orders, deliveryCompanies, updateMultipleOrdersStatus]);
  // Ouvrir la modal d'édition - mémorisé
  const openEditModal = useCallback((order: Order) => {
    setEditingOrder(order)
    setSelectedDeliveryman(order.additionalInfo || "")
    setIsEditModalOpen(true)
  }, [])

  // Sauvegarder les modifications - mémorisé
  const saveEditing = useCallback(() => {
    if (!editingOrder) return

    // Si la société de livraison est "Deliveryman", mettre à jour avec le nom du livreur
    if (editingOrder.deliveryCompany === "Deliveryman" && selectedDeliveryman) {
      updateOrder(editingOrder.id, {
        deliveryCompany: selectedDeliveryman,
      })
      toast({
        title: "Modifications enregistrées",
        description: `Le livreur pour la commande ${editingOrder.id} a été mis à jour.`,
      })
    }

    setIsEditModalOpen(false)
    setEditingOrder(null)
  }, [editingOrder, selectedDeliveryman, updateOrder])

  // Ouvrir la modal de sélection du mode de scan
  const openScanModeDialog = useCallback(() => {
    setIsScanModeDialogOpen(true)
  }, [])

  // Démarrer le scan avec le mode sélectionné
  const startScanWithMode = useCallback((mode: ScanMode) => {
    setScanMode(mode)
    setScannedOrders([])
    setTrackingId(
      `TR-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`,
    )
    setIsScanModeDialogOpen(false)

    // Focus sur l'input de code-barres
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
    }, 100)
  }, [])

  // Terminer la session de scan
  const finishScanSession = useCallback(() => {
    // Mettre à jour le statut des commandes scannées
    const scannedOrderIds = scannedOrders.map((order) => order.id)
    if (scannedOrders.length > 0) {
     

      // Mettre à jour les commandes en fonction du mode de scan
      if (scanMode === "delivery_company") {
        updateMultipleOrdersStatus(scannedOrderIds, "Dispatcher")
      } else if (scanMode === "assign_deliveryman") {
        // Assigner au livreur
        scannedOrders.forEach((order) => {
          updateOrder(order.id, {
            deliveryCompany: selectedDeliveryman, // Change to the selected deliveryman name
          })
        })
        updateMultipleOrdersStatus(scannedOrderIds, "Dispatcher")
      } else if (scanMode === "dispatch_deliveryman") {
        // Dispatcher pour le livreur
        scannedOrders.forEach((order) => {
          updateOrder(order.id, {
            deliveryCompany: "Deliveryman",
            additionalInfo: selectedDeliveryman,
          })
        })
        updateMultipleOrdersStatus(scannedOrderIds, "Dispatcher")
      }

      toast({
        title: "Session de scan terminée",
        description: `${scannedOrders.length} commande(s) traitée(s) avec succès.`,
      })
    }

    // Réinitialiser les états
    setScanMode(null)
    setScannedOrders([])
    setSelectedDeliveryman("")
    setSelectedDeliveryCompany("")
    setTrackingId("")
    setBarcodeValue("")
  }, [
    scannedOrders,
    scanMode,
    selectedDeliveryman,
    selectedDeliveryCompany,
    trackingId,
    updateOrder,
    updateMultipleOrdersStatus,
  ])

  // Réinitialiser les filtres - mémorisé
  const resetFilters = useCallback(() => {
    setDeliveryCompanyFilter("all")
    setDateRange(undefined)
  }, [])

  // Obtenir la couleur du badge pour le type de livraison - mémorisé
  const getDeliveryTypeColor = useCallback((type: DeliveryType) => {
    switch (type) {
      case "Domicile":
        return "bg-blue-950/50 text-blue-400 border-blue-700"
      case "Point de relais":
        return "bg-purple-950/50 text-purple-400 border-purple-700"
      case "Express":
        return "bg-amber-950/50 text-amber-400 border-amber-700"
      default:
        return "bg-slate-950/50 text-slate-400 border-slate-700"
    }
  }, [])

  // Gérer le déplacement d'une commande individuelle - mémorisé
  const handleMoveOrder = useCallback(
    (orderId: string) => {
      handleSelectRow(orderId, true)
      updateMultipleOrdersStatus([orderId], "Dispatcher")
      toast({
        title: "Commande déplacée",
        description: `La commande a été déplacée vers "Dispatcher".`,
      })
    },
    [handleSelectRow, updateMultipleOrdersStatus],
  )

  // Supprimer une commande scannée
  const removeScannedOrder = useCallback((orderId: string) => {
    setScannedOrders((prev) => prev.filter((order) => order.id !== orderId))
    toast({
      title: "Commande retirée",
      description: `La commande ${orderId} a été retirée de la session de scan.`,
    })
  }, [])

  // Obtenir le titre du mode de scan
  const getScanModeTitle = useCallback(() => {
    switch (scanMode) {
      case "delivery_company":
        return `Dispatcher pour ${selectedDeliveryCompany}`
      case "assign_deliveryman":
        return `Assigner à ${selectedDeliveryman}`
      case "dispatch_deliveryman":
        return `Dispatcher pour ${selectedDeliveryman}`
      default:
        return "Scanner"
    }
  }, [scanMode, selectedDeliveryCompany, selectedDeliveryman])

  // Gérer le changement de visibilité des colonnes
  const toggleColumnVisibility = useCallback((column: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }))
  }, [])

  // Process barcode input
  const processBarcode = useCallback(
    (barcode: string) => {
      if (!barcode.trim()) {
        toast({
          title: "Code-barres vide",
          description: "Veuillez scanner un code-barres valide.",
          variant: "destructive",
        })
        return
      }

      // Vérifier si un mode de scan est sélectionné
      if (!scanMode) {
        toast({
          title: "Mode de scan non sélectionné",
          description: "Veuillez sélectionner un mode de scan avant de commencer.",
          variant: "destructive",
        })
        return
      }

      // Rechercher la commande par ID
      const order = orders.find((o) => o.trackingId === barcode.trim())

      if (order) {
        // Vérifier si la commande a déjà été scannée
        if (scannedOrders.some((o) => o.trackingId === order.trackingId)) {
          toast({
            title: "Commande déjà scannée",
            description: `La commande ${order.trackingId} a déjà été scannée dans cette session.`,
            variant: "destructive",
          })
          playAlertSound()
          return
        }

        // Check for different delivery company
       {/*} const hasDifferentDeliveryCompany =
          scanMode === "delivery_company" &&
          order.deliveryCompany &&
          order.deliveryCompany !== "Deliveryman"

        if (hasDifferentDeliveryCompany) {
          toast({
            title: "Société de livraison différente",
            description: `La commande ${order.id} est déjà assignée à ${order.deliveryCompany}. Elle n'a pas été ajoutée.`,
            variant: "destructive",
          })
          playAlertSound()
          return // Exit early without adding the order
        }
       */}
        // Check if in assign_deliveryman mode and order doesn't have "Deliveryman" as delivery company
        if (scanMode === "assign_deliveryman" && order.deliveryCompany !== "Deliveryman") {
          toast({
            title: "Société de livraison incorrecte",
            description: `La commande ${order.id} n'est pas assignée à "Deliveryman". Elle n'a pas été ajoutée.`,
            variant: "destructive",
          })
          playAlertSound()
          return // Exit early without adding the order
        }

        // Check for multiple articles
        let hasMultipleArticles = false
        if (order.articles && order.articles.length > 2) {
          hasMultipleArticles = true
          toast({
            title: "Attention: Commande volumineuse",
            description: `La commande ${order.trackingId} contient ${order.articles.length} articles.`,
            variant: "warning",
          })
          playWarningSound()
        }

        // Ajouter la commande aux commandes scannées
        setScannedOrders((prev) => [...prev, order])

        {/*  if (!hasDifferentDeliveryCompany && !hasMultipleArticles) {
          playSuccessSound()
        } */}
        // Play success sound if no warnings
        if (!hasMultipleArticles) {
          playSuccessSound()
        }

        toast({
          title: "Commande scannée",
          description: `La commande ${order.trackingId} a été ajoutée à la session de scan.`,
        })
      } else {
        toast({
          title: "Code-barres non trouvé",
          description: "Aucune commande en préparation trouvée avec ce code-barres.",
          variant: "destructive",
        })
        playAlertSound()
      }

      // Refocus sur l'input
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
    },
    [orders, scanMode, scannedOrders, selectedDeliveryCompany, toast],
  )

  // State to track if the barcode processing is active
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false)

const handleBarcodeChange = useCallback(
  (value: string) => {
    setBarcodeValue(value)

    // Only process when barcode is exactly 10 characters
    if (value.trim().length === 10 && !isProcessingBarcode) {
      setIsProcessingBarcode(true)

      processBarcode(value.trim())
      setBarcodeValue("")

      setTimeout(() => {
        setIsProcessingBarcode(false)
      }, 300) // Small cooldown to prevent double processing
    }
  },
  [processBarcode, isProcessingBarcode]
)
const printSelectedLabels = useCallback(async () => {
  if (selectedRows.length === 0) {
    toast({
      title: "Aucune commande sélectionnée",
      description: "Veuillez sélectionner au moins une commande pour imprimer les étiquettes.",
      variant: "destructive",
    });
    return;
  }

  const ordersToPrint = filteredOrders.filter(order => selectedRows.includes(order.id));
  const deliverymanOrders = ordersToPrint.filter(o => o.deliveryCompany === "deliveryMen");
  const externalOrders = ordersToPrint.filter(o => o.deliveryCompany !== "deliveryMen");

  // 🔄 Create a single merged PDF document
  const mergedPdf = await PDFDocument.create();

  // 🧷 Merge deliveryMan-generated labels
  for (const order of deliverymanOrders) {
    try {
      const pdfBuffer = await generateParcelLabel(order, { returnPdfBuffer: true });
      const singlePdf = await PDFDocument.load(pdfBuffer);
      const pages = await mergedPdf.copyPages(singlePdf, singlePdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    } catch (error) {
      console.error(`Erreur lors de la génération de l’étiquette pour la commande ${order.id}:`, error);
    }
  }

  // 🌐 Merge external order label PDFs from URLs
  for (const order of externalOrders) {
    try {
const response = await fetch(`/api/fetch-label?url=${encodeURIComponent(order.label)}`);
      const pdfBuffer = await response.arrayBuffer();
      const externalPdf = await PDFDocument.load(pdfBuffer);
      const pages = await mergedPdf.copyPages(externalPdf, externalPdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    } catch (error) {
      console.error(`Erreur lors du chargement de l’étiquette externe pour ${order.id}:`, error);
    }
  }

  // 🧾 Save and open merged PDF
  const mergedPdfBytes = await mergedPdf.save();
  const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);

  const printWindow = window.open(blobUrl, "_blank");
  if (printWindow) {
    printWindow.focus();
  }

  // ✅ Mark all selected orders as printed
  await Promise.all(
    selectedRows.map(id => updateOrder(id, { isPrinted: true }))
  );

  toast({
    title: "Impression prête",
    description: `Les ${selectedRows.length} étiquettes ont été combinées en un seul fichier PDF.`,
  });

}, [selectedRows, filteredOrders, toast]);
  const changeConfirmatrices = (e) => {}
    const changeConfirmatrice = useCallback(() => {
      if (!selectedConfirmatrice) {
        toast({
          title: "Aucune confirmatrice sélectionnée",
          description: "Veuillez sélectionner une confirmatrice.",
          variant: "destructive",
        })
        return
      }
  
      selectedRows.forEach((id) => {
        updateOrder(id, { confirmatrice: selectedConfirmatrice })
      })
  
      toast({
        title: "Confirmatrice mise à jour",
        description: `La confirmatrice a été changée pour ${selectedRows.length} commande(s).`,
      })
  
      setIsConfirmatriceModalOpen(false)
      setSelectedConfirmatrice("")
    }, [selectedRows, selectedConfirmatrice, updateOrder])

    const [isCameraMode, setIsCameraMode] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [isInitializing, setIsInitializing] = useState(false)
    const [lastScanned, setLastScanned] = useState<string | null>(null)
    const [scanCount, setScanCount] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [detectedCode, setDetectedCode] = useState<string | null>(null)
    const [barcodeFormat, setBarcodeFormat] = useState<string>("code_128")

    const scannerRef = useRef<HTMLDivElement>(null)
    const quaggaInitialized = useRef<boolean>(false)
    const initializationInProgress = useRef<boolean>(false)
  
    const barcodeFormats = [
      { value: "code_128", label: "Code 128" },
      { value: "code_39", label: "Code 39" },
      { value: "code_93", label: "Code 93" },
      { value: "ean", label: "EAN" },
      { value: "ean_8", label: "EAN-8" },
      { value: "upc", label: "UPC" },
    ]
  
    const validateBarcodeFormat = (code: string): boolean => {
      // Check if the code matches the yal-XXXXXX format
      const regex = /^yal-[A-Z0-9]{6}$/i
      return regex.test(code)
    }

  

    
  

  
    const startScanner = useCallback(async () => {
      // Prevent multiple simultaneous initializations
      if (initializationInProgress.current || quaggaInitialized.current) {
        return
      }
  
      if (!scannerRef.current) {
        setError("Élément scanner non trouvé")
        return
      }
  
      try {
        initializationInProgress.current = true
        setIsInitializing(true)
        setError(null)
  
        // Clean up any existing Quagga instance
        if (quaggaInitialized.current) {
          Quagga.stop()
          quaggaInitialized.current = false
        }
  
        // Wait a bit to ensure cleanup is complete
        await new Promise((resolve) => setTimeout(resolve, 100))
  
        return new Promise<void>((resolve, reject) => {
          Quagga.init(
            {
              inputStream: {
                name: "Live",
                type: "LiveStream",
                target: scannerRef.current,
                constraints: {
                  facingMode: "environment",
                  width: { min: 450, ideal: 640 },
                  height: { min: 300, ideal: 480 },
                  aspectRatio: { min: 1, max: 2 },
                },
              },
              locator: {
                patchSize: "medium",
                halfSample: true,
              },
              numOfWorkers: navigator.hardwareConcurrency || 2,
              frequency: 10,
              decoder: {
                readers: [`${barcodeFormat}_reader`],
                debug: {
                  drawBoundingBox: true,
                  showFrequency: false,
                  drawScanline: true,
                  showPattern: false,
                },
              },
              locate: true,
            },
            (err) => {
              initializationInProgress.current = false
              setIsInitializing(false)
  
              if (err) {
                console.error("Error initializing Quagga:", err)
                setError("Erreur d'initialisation du scanner. Veuillez réessayer.")
                setIsCameraMode(false)
                reject(err)
                return
              }
  
              try {
                quaggaInitialized.current = true
                Quagga.start()
                setIsScanning(true)
                resolve()
              } catch (startError) {
                console.error("Error starting Quagga:", startError)
                setError("Erreur de démarrage du scanner.")
                reject(startError)
              }
            },
          )
  
          // Set up barcode detection handler
          Quagga.onDetected((result) => {
            if (result && result.codeResult && result.codeResult.code) {
              const code = result.codeResult.code
              setDetectedCode(code)
              processBarcode(code)
  
              // Brief pause after successful scan to prevent multiple scans
              if (quaggaInitialized.current) {
                Quagga.pause()
                setTimeout(() => {
                  setDetectedCode(null)
                  if (isScanning && quaggaInitialized.current) {
                    try {
                      Quagga.start()
                    } catch (restartError) {
                      console.error("Error restarting scanner:", restartError)
                    }
                  }
                }, 2000)
              }
            }
          })
        })
      } catch (error) {
        initializationInProgress.current = false
        setIsInitializing(false)
        console.error("Scanner initialization failed:", error)
        setError("Impossible d'initialiser le scanner. Vérifiez les permissions de la caméra.")
      }
    }, [barcodeFormat, isScanning, processBarcode])
  
    const stopScanner = useCallback(() => {
      try {
        if (quaggaInitialized.current) {
          Quagga.stop()
          quaggaInitialized.current = false
        }
        setIsScanning(false)
        setDetectedCode(null)
        setIsInitializing(false)
        initializationInProgress.current = false
      } catch (error) {
        console.error("Error stopping scanner:", error)
      }
    }, [])
  
    const toggleCameraMode = async () => {
      if (isCameraMode) {
        stopScanner()
        setIsCameraMode(false)
      } else {
        setIsCameraMode(true)
        // Start scanner after state update
        setTimeout(() => {
          if (!initializationInProgress.current) {
            startScanner()
          }
        }, 100)
      }
    }

  
    // Cleanup on unmount
    useEffect(() => {
      return () => {
        stopScanner()
      }
    }, [stopScanner])
  
    // Handle camera mode changes
    useEffect(() => {
      if (isCameraMode && !quaggaInitialized.current && !initializationInProgress.current) {
        startScanner()
      }
    }, [isCameraMode, startScanner])
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative w-full sm:max-w-xs">
            <div className="h-10 w-full bg-slate-800/50 rounded-md animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-20 bg-slate-800/50 rounded-md animate-pulse"></div>
            <div className="h-10 w-10 bg-slate-800/50 rounded-md animate-pulse"></div>
          </div>
        </div>

        <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
          <div className="h-[400px] w-full bg-slate-800/20 animate-pulse flex items-center justify-center">
            <span className="text-slate-500">Chargement des données...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Toaster />

      {/* Modal d'édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle>Modifier la commande</DialogTitle>
            <DialogDescription>
              {editingOrder?.deliveryCompany === "Deliveryman"
                ? "Sélectionnez le livreur pour cette commande."
                : "Les détails de cette commande ne sont pas modifiables."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="id" className="text-right">
                ID
              </Label>
              <Input
                id="id"
                value={editingOrder?.id || ""}
                readOnly
                className="col-span-3 bg-slate-800/50 border-slate-700"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Client
              </Label>
              <Input
                id="name"
                value={editingOrder?.name || ""}
                readOnly
                className="col-span-3 bg-slate-800/50 border-slate-700"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deliveryCompany" className="text-right">
                Société de livraison
              </Label>
              {editingOrder?.deliveryCompany === "Deliveryman" ? (
                <div className="col-span-3">
                  <Select value={selectedDeliveryman} onValueChange={setSelectedDeliveryman}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700">
                      <SelectValue placeholder="Sélectionner un livreur" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {deliverymen.map((deliveryman) => (
                        <SelectItem key={deliveryman} value={deliveryman}>
                          {deliveryman}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Input
                  id="deliveryCompany"
                  value={editingOrder?.deliveryCompany || ""}
                  readOnly
                  className="col-span-3 bg-slate-800/50 border-slate-700"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-slate-700">
              Annuler
            </Button>
            <Button
              onClick={saveEditing}
              disabled={editingOrder?.deliveryCompany !== "Deliveryman"}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
            <Dialog open={isConfirmatriceModalOpen} onOpenChange={setIsConfirmatriceModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle>Changer la confirmatrice</DialogTitle>
            <DialogDescription>
              Sélectionnez une confirmatrice pour les {selectedRows.length} commande(s) sélectionnée(s).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedConfirmatrice}
              onValueChange={(e) => {
                setSelectedConfirmatrice(e)
                changeConfirmatrices(e)
              }}
            >
              <SelectTrigger className="bg-slate-800/50 border-slate-700">
                <SelectValue placeholder="Sélectionner une confirmatrice" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {confirmatrices.map((confirmatrice) => (
                  <SelectItem key={confirmatrice} value={confirmatrice}>
                    {confirmatrice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmatriceModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={changeConfirmatrice}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal de sélection du mode de scan */}
      <Dialog open={isScanModeDialogOpen} onOpenChange={setIsScanModeDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle>Sélectionner le mode de scan</DialogTitle>
            <DialogDescription>Veuillez sélectionner le mode de scan avant de commencer.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <Tabs defaultValue="delivery_company" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="delivery_company">Société de livraison</TabsTrigger>
                <TabsTrigger value="assign_deliveryman">Assigner livreur</TabsTrigger>
              
              </TabsList>

              <TabsContent value="delivery_company" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryCompany">Société de livraison</Label>
                  <Select value={selectedDeliveryCompany} onValueChange={setSelectedDeliveryCompany}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700">
                      <SelectValue placeholder="Sélectionner une société" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {deliveryCompaniess?.map((company) => (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => startScanWithMode("delivery_company")}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Commencer le scan
                </Button>
              </TabsContent>

              <TabsContent value="assign_deliveryman" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryman">Livreur</Label>
                  <Select value={selectedDeliveryman} onValueChange={setSelectedDeliveryman}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700">
                      <SelectValue placeholder="Sélectionner un livreur" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {deliverymen.map((deliveryman) => (
                        <SelectItem key={deliveryman} value={deliveryman}>
                          {deliveryman}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => startScanWithMode("assign_deliveryman")}
                  disabled={!selectedDeliveryman}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
                >
                  <User className="h-4 w-4 mr-2" />
                  Commencer le scan
                </Button>
              </TabsContent>

            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scanner de code-barres */}
      {scanMode ? (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{getScanModeTitle()}</CardTitle>
                <CardDescription>
                  ID de suivi: {trackingId} | Colis scannés: {scannedOrders.length}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={finishScanSession} className="border-slate-700">
                Terminer
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Scanner un code-barres..."
                  className="w-full pl-8 bg-slate-800/50 border-slate-700 focus-visible:ring-emerald-500"
                  value={barcodeValue}
                  onChange={(e) => {
                    const value = e.target.value
                    handleBarcodeChange(value)
                  }}
                />
              </div>
              <Button
          onClick={toggleCameraMode}
          variant={isCameraMode ? "destructive" : "outline"}
          size="icon"
          className="shrink-0"
          disabled={isInitializing}
        >
          {isCameraMode ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
        </Button>
            </div>
            {isCameraMode && (
        <div className="mb-4 relative">
          <div
            ref={scannerRef}
            className="relative bg-black rounded-lg overflow-hidden"
            style={{ height: "300px", position: "relative" }}
          >
            {/* Loading overlay */}
            {isInitializing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Initialisation de la caméra...</p>
                </div>
              </div>
            )}

            {/* Barcode scanning overlay - horizontal line for barcode scanning */}
            {!isInitializing && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-emerald-500 transform -translate-y-1/2 z-10 animate-pulse"></div>
                <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-16 border-t-2 border-b-2 border-emerald-500/30"></div>

                {/* Format reminder */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="bg-black/70 text-white px-3 py-1 rounded-full text-xs">Format: yal-XXXXXX</div>
                </div>
              </div>
            )}

            {/* Status indicator */}
            {!isInitializing && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {detectedCode ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      Code détecté: {detectedCode}
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      Recherche de codes-barres yal-XXXXXX...
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
            {scannedOrders.length > 0 && (
              <div className="border border-slate-800 rounded-md overflow-hidden">
                <ScrollArea className="h-[200px]">
                  <div className="p-2">
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Colis scannés</h3>
                    <div className="space-y-2">
                      {scannedOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex justify-between items-center p-2 bg-slate-800/30 rounded-md"
                        >
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="font-medium text-slate-300">{order.trackingId}</span>
                              <span className="mx-2 text-slate-500">|</span>
                              <span className="text-slate-400">{order.name}</span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {order.wilaya}, {order.commune} | {order.totalPrice} DA
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeScannedOrder(order.id)}
                            className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-slate-800"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Retirer</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>

          <CardFooter>
            <div className="text-xs text-slate-500">
              {scanMode === "delivery_company" && `Les colis seront dispatchés pour ${selectedDeliveryCompany}`}
              {scanMode === "assign_deliveryman" && `Les colis seront assignés à ${selectedDeliveryman}`}
              {scanMode === "dispatch_deliveryman" && `Les colis seront dispatchés pour ${selectedDeliveryman}`}
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Button
          onClick={openScanModeDialog}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
        >
          <Barcode className="h-4 w-4 mr-2" />
          Commencer une session de scan
        </Button>
      )}

      {/* Barre d'outils */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="w-full pl-8 bg-slate-800/50 border-slate-700 focus-visible:ring-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
        <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={printSelectedLabels}
                  disabled={selectedRows.length === 0}
                  className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  <span>Imprimer étiquettes</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Imprimer les étiquettes des commandes sélectionnées</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {!scanMode && (
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={moveBack}
                    disabled={selectedRows.length === 0}
                    className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                  >
                    <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                    <span>Confirmés</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Déplacer les commandes sélectionnées vers "Confirmés"</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={moveToDispatcher}
                  disabled={selectedRows.length === 0}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  <span>Dispatcher</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Déplacer les commandes sélectionnées vers "Dispatcher"</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-slate-700 bg-slate-800/50">
                <Columns className="h-4 w-4" />
                <span className="sr-only">Colonnes</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
              <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuCheckboxItem
                checked={visibleColumns.id}
                onCheckedChange={() => toggleColumnVisibility("id")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                ID
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.date}
                onCheckedChange={() => toggleColumnVisibility("date")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Date
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.name}
                onCheckedChange={() => toggleColumnVisibility("name")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Nom
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.phone}
                onCheckedChange={() => toggleColumnVisibility("phone")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Téléphone
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.articles}
                onCheckedChange={() => toggleColumnVisibility("articles")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Articles
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.wilaya}
                onCheckedChange={() => toggleColumnVisibility("wilaya")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Wilaya
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.commune}
                onCheckedChange={() => toggleColumnVisibility("commune")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Commune
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.deliveryType}
                onCheckedChange={() => toggleColumnVisibility("deliveryType")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Type de livraison
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.deliveryCompany}
                onCheckedChange={() => toggleColumnVisibility("deliveryCompany")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Société de livraison
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.pickupPoint}
                onCheckedChange={() => toggleColumnVisibility("pickupPoint")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Point de relais
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.deliveryPrice}
                onCheckedChange={() => toggleColumnVisibility("deliveryPrice")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Prix de livraison
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.address}
                onCheckedChange={() => toggleColumnVisibility("address")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Adresse
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.totalPrice}
                onCheckedChange={() => toggleColumnVisibility("totalPrice")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Prix total
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.source}
                onCheckedChange={() => toggleColumnVisibility("source")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Source
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Select defaultValue="10">
            <SelectTrigger className="w-[80px] bg-slate-800/50 border-slate-700 focus:ring-emerald-500">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 p-3 rounded-md border border-slate-800 bg-slate-900/50">
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2 text-slate-400" />
          <span className="text-sm text-slate-400 mr-2">Filtres:</span>
        </div>

        <Select value={deliveryCompanyFilter} onValueChange={setDeliveryCompanyFilter}>
          <SelectTrigger className="h-8 w-[180px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Société de livraison" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">Toutes les sociétés</SelectItem>
             {[...deliveryCompaniess, { companyId: "deliveryMen" }].map((company) => (
              <SelectItem key={company.companyId} value={company.companyId}>
                {company.companyId}
              </SelectItem>
            ))}
            {deliverymen.map((deliveryman) => (
              <SelectItem key={deliveryman} value={deliveryman}>
                {deliveryman}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
                <Select value={confirmatriceFilter} onValueChange={setConfirmatriceFilter}>
                  <SelectTrigger className="h-8 w-[150px] bg-slate-800/50 border-slate-700">
                    <SelectValue placeholder="Confirmatrice" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="all">Confirmatrice</SelectItem>
                    {confirmatrices.map((confirmatrice) => (
                      <SelectItem key={confirmatrice} value={confirmatrice}>
                        {confirmatrice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
          className="h-8 border-slate-700 bg-slate-800/50 text-slate-400"
        >
          Réinitialiser
        </Button>
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <div className="max-h-[70vh] overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="border-b border-slate-800">
                  <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400 w-[40px]">
                    <Checkbox
                      checked={selectedRows.length > 0 && selectedRows.length === filteredOrders.length}
                      onCheckedChange={handleSelectAll}
                      className="bg-slate-800/50 border-slate-700 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                  </th>
                    {visibleColumns.id && <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Tracking</th>}
                  {visibleColumns.id && <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">ID</th>}
                  {visibleColumns.date && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Date</th>
                  )}
                        
                  {visibleColumns.name && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Name</th>
                  )}
                  {visibleColumns.phone && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Phone</th>
                  )}
                  {visibleColumns.articles && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Articles</th>
                  )}
                  {visibleColumns.wilaya && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Wilaya</th>
                  )}
                  {visibleColumns.commune && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Commune</th>
                  )}
                  {visibleColumns.deliveryType && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Delivery Type</th>
                  )}
                  {visibleColumns.deliveryCompany && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Delivery Company</th>
                  )}
                  {visibleColumns.pickupPoint && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Point de relais</th>
                  )}
                  {visibleColumns.deliveryPrice && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Delivery Price</th>
                  )}
                                   {visibleColumns.confirmatrice && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Confirmatrice</th>
                  )}
                  {visibleColumns.address && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Address</th>
                  )}
                  {visibleColumns.totalPrice && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Total Price</th>
                  )}
                  {visibleColumns.source && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Source</th>
                  )}
                  <th className="sticky top-0 bg-slate-900 p-3 text-right text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr className="border-b border-slate-800">
                    <td colSpan={17} className="text-center py-8 text-slate-400">
                      Aucune commande trouvée
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                    key={order.id}
                    className={cn(
                      "border-b border-slate-800 hover:bg-slate-800/50",
                      selectedRows.includes(order.id) && "bg-slate-800/30",
                      order.isPrinted && "bg-emerald-900/30",
searchFilters.highlightOrder === order.id && "ring-2 ring-cyan-500 bg-cyan-900/20",                   
 )}
                  >
                      <td className="p-3">
                        <Checkbox
                          checked={selectedRows.includes(order.id)}
                          onCheckedChange={(checked) => handleSelectRow(order.id, checked === true)}
                          className="bg-slate-800/50 border-slate-700 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                      </td>
                        {visibleColumns.id && <td className="p-3 font-medium text-slate-300">{order?.trackingId}</td>}
                      {visibleColumns.id && <td className="p-3 font-medium text-slate-300">{order?.orderReference}</td>}
                      {visibleColumns.date && <td className="p-3 text-slate-300">{order.date}</td>}

                      {visibleColumns.name && <td className="p-3 text-slate-300">{order.name}</td>}
                      {visibleColumns.phone && <td className="p-3 text-slate-300">{order.phone}</td>}
                                            {visibleColumns.articles && (
  <td className="p-3 text-slate-300">
  <HoverCard>
    <HoverCardTrigger className="cursor-pointer hover:text-cyan-400 transition-colors block truncate">
      {(() => {
        const allProducts = order.articles.map((article: { product_name: string }) => article.product_name).join(", ");
        return allProducts.length > 7 ? `${allProducts.substring(0, 7)}...` : allProducts;
      })()}
    </HoverCardTrigger>
    <HoverCardContent className="w-80 bg-slate-900 border-slate-800 p-0">
      <div className="p-3 border-b border-slate-800">
        <h4 className="text-sm font-medium text-slate-200">Détails des articles</h4>
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        <div className="p-3 space-y-2">
          {order.articles.map((article: any, index: number) => {
            const productTitle =
              `${article.product_name} ${article.variant_options?.option1 || ""} ${article.variant_options?.option2 || ""} (${article.quantity || ""})`.trim()
            return (
              <div key={index} className="p-2 bg-slate-800/50 rounded-md border border-slate-700">
                <div className="text-sm text-slate-200 font-medium">{article.product_name}</div>
                {(article.variant_options?.option1 || article.variant_options?.option2) && (
                  <div className="text-xs text-slate-400 mt-1">
                    Variante:{" "}
                    {[article.variant_options?.option1, article.variant_options?.option2]
                      .filter(Boolean)
                      .join(" / ")}
                  </div>
                )}
                {article.quantity && <div className="text-xs text-slate-400">Quantité: {article.quantity}</div>}
                {article.price && <div className="text-xs text-slate-400">Prix: {article.price}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>
</td>
)}
                      {visibleColumns.wilaya && <td className="p-3 text-slate-300">{order.wilaya}</td>}
                      {visibleColumns.commune && <td className="p-3 text-slate-300">{order.commune}</td>}
                      {visibleColumns.deliveryType && (
                        <td className="p-3 text-slate-300">
                          <Badge className={getDeliveryTypeColor(order.deliveryType)} variant="outline">
                            {order.deliveryType}
                          </Badge>
                        </td>
                      )}
                      {visibleColumns.deliveryCompany && (
                        <td className="p-3 text-slate-300">{order.deliveryCompany}</td>
                      )}
                      {visibleColumns.pickupPoint && <td className="p-3 text-slate-300">{order.pickupPoint || "-"}</td>}
                      {visibleColumns.deliveryPrice && <td className="p-3 text-slate-300">{order.deliveryPrice}</td>}
                                            {visibleColumns.confirmatrice && <td className="p-3 text-slate-300">{order.confirmatrice}</td>}

                      {visibleColumns.address && (
                        <td className="p-3 text-slate-300 max-w-[200px] truncate">{order.address}</td>
                      )}
                      {visibleColumns.totalPrice && <td className="p-3 text-slate-300">{order.totalPrice}</td>}
                      {visibleColumns.source && <td className="p-3 text-slate-300">{order.source}</td>}
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(order)}
                            className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Modifier</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveOrder(order.id)}
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-slate-800"
                          >
                            <ArrowRight className="h-4 w-4" />
                            <span className="sr-only">Déplacer</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-slate-800" />
                              <DropdownMenuItem className="hover:bg-slate-800 focus:bg-slate-800">
                                <Package className="mr-2 h-4 w-4" />
                                <span>Détails</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="hover:bg-slate-800 focus:bg-slate-800">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                <span>Changer le statut</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="hover:bg-slate-800 focus:bg-slate-800"
                                onClick={() => {
                                  updateMultipleOrdersStatus([order.id], "Confirmés")
                                  toast({
                                    title: "Commande déplacée",
                                    description: `La commande a été déplacée vers "Confirmés".`,
                                  })
                                }}
                              >
                                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                                <span>Retour vers Confirmés</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" disabled className="border-slate-700 bg-slate-800/50 text-slate-400">
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
        >
          Suivant
        </Button>
      </div>
    </div>
  )
}
