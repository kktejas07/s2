/**
 * App-wide icon set: Phosphor icons exposed under the Lucide names the pages
 * already use, so switching styles is a single-file change.
 *
 * - Glyph/control icons (arrows, chevrons, close, plus...) use the "bold" weight
 *   so they stay crisp at 12-16px.
 * - Object/concept icons use "duotone" for a softer, two-tone look that picks
 *   up the surrounding text colour.
 */
import type { ComponentType, SVGProps } from "react";
import type { IconProps as PhosphorProps, IconWeight } from "@phosphor-icons/react";
import {
  ArrowDownLeft as PhArrowDownLeft,
  ArrowLeft as PhArrowLeft,
  ArrowRight as PhArrowRight,
  ArrowSquareOut as PhArrowSquareOut,
  ArrowUp as PhArrowUp,
  ArrowUpRight as PhArrowUpRight,
  ArrowsClockwise as PhArrowsClockwise,
  Bank as PhBank,
  BookOpen as PhBookOpen,
  Briefcase as PhBriefcase,
  BuildingOffice as PhBuildingOffice,
  Buildings as PhBuildings,
  Calculator as PhCalculator,
  Calendar as PhCalendar,
  CalendarCheck as PhCalendarCheck,
  Camera as PhCamera,
  CaretDown as PhCaretDown,
  CaretLeft as PhCaretLeft,
  CaretRight as PhCaretRight,
  ChartBar as PhChartBar,
  Check as PhCheck,
  CheckCircle as PhCheckCircle,
  CheckSquare as PhCheckSquare,
  CircleNotch as PhCircleNotch,
  ClipboardText as PhClipboardText,
  Clock as PhClock,
  ClockCounterClockwise as PhClockCounterClockwise,
  Coins as PhCoins,
  Columns as PhColumns,
  Compass as PhCompass,
  Copy as PhCopy,
  Cpu as PhCpu,
  CreditCard as PhCreditCard,
  Cube as PhCube,
  CurrencyInr as PhCurrencyInr,
  DotsThreeVertical as PhDotsThreeVertical,
  DownloadSimple as PhDownloadSimple,
  EnvelopeSimple as PhEnvelopeSimple,
  Eye as PhEye,
  EyeSlash as PhEyeSlash,
  Factory as PhFactory,
  FileCode as PhFileCode,
  FilePlus as PhFilePlus,
  FileText as PhFileText,
  FileXls as PhFileXls,
  Files as PhFiles,
  Fire as PhFire,
  Flag as PhFlag,
  FloppyDisk as PhFloppyDisk,
  Funnel as PhFunnel,
  Gauge as PhGauge,
  GearSix as PhGearSix,
  GitCommit as PhGitCommit,
  Globe as PhGlobe,
  GridFour as PhGridFour,
  Handshake as PhHandshake,
  HardHat as PhHardHat,
  Hash as PhHash,
  Info as PhInfo,
  Lightning as PhLightning,
  List as PhList,
  ListChecks as PhListChecks,
  ListDashes as PhListDashes,
  LockSimple as PhLockSimple,
  LockSimpleOpen as PhLockSimpleOpen,
  MagnifyingGlass as PhMagnifyingGlass,
  MagnifyingGlassMinus as PhMagnifyingGlassMinus,
  MapPin as PhMapPin,
  Medal as PhMedal,
  Moon as PhMoon,
  NotePencil as PhNotePencil,
  Package as PhPackage,
  Palette as PhPalette,
  PaperPlaneTilt as PhPaperPlaneTilt,
  Paperclip as PhPaperclip,
  Pause as PhPause,
  PencilSimple as PhPencilSimple,
  Percent as PhPercent,
  Phone as PhPhone,
  PhoneCall as PhPhoneCall,
  Pill as PhPill,
  Play as PhPlay,
  Plus as PhPlus,
  Power as PhPower,
  Printer as PhPrinter,
  Pulse as PhPulse,
  Question as PhQuestion,
  Receipt as PhReceipt,
  Repeat as PhRepeat,
  Robot as PhRobot,
  Rows as PhRows,
  Ruler as PhRuler,
  Scales as PhScales,
  SealWarning as PhSealWarning,
  Shield as PhShield,
  ShieldCheck as PhShieldCheck,
  ShieldWarning as PhShieldWarning,
  ShoppingBag as PhShoppingBag,
  SidebarSimple as PhSidebarSimple,
  SignOut as PhSignOut,
  Signature as PhSignature,
  Sliders as PhSliders,
  SlidersHorizontal as PhSlidersHorizontal,
  Sparkle as PhSparkle,
  SquaresFour as PhSquaresFour,
  Stack as PhStack,
  StackSimple as PhStackSimple,
  Star as PhStar,
  Sun as PhSun,
  Table as PhTable,
  Tag as PhTag,
  Trash as PhTrash,
  TrendDown as PhTrendDown,
  TrendUp as PhTrendUp,
  Truck as PhTruck,
  UploadSimple as PhUploadSimple,
  User as PhUser,
  ArrowsLeftRight as PhArrowsLeftRight,
  Bell as PhBell,
  ChatCircle as PhChatCircle,
  FileMagnifyingGlass as PhFileMagnifyingGlass,
  Pen as PhPen,
  ShoppingCart as PhShoppingCart,
  SignIn as PhSignIn,
  UserCheck as PhUserCheck,
  UserMinus as PhUserMinus,
  UserPlus as PhUserPlus,
  Users as PhUsers,
  Warning as PhWarning,
  WarningCircle as PhWarningCircle,
  WarningOctagon as PhWarningOctagon,
  Wrench as PhWrench,
  X as PhX,
  XCircle as PhXCircle,
} from "@phosphor-icons/react/dist/ssr";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  /** Accepted for Lucide compatibility; Phosphor weights control stroke instead. */
  strokeWidth?: number | string;
  weight?: IconWeight;
  size?: number | string;
};
export type Icon = ComponentType<IconProps>;

function make(Ph: ComponentType<PhosphorProps>, defaultWeight: IconWeight, name: string): Icon {
  const Wrapped = ({ strokeWidth: _strokeWidth, weight = defaultWeight, ...rest }: IconProps) => (
    <Ph weight={weight} aria-hidden={rest["aria-label"] ? undefined : true} {...(rest as PhosphorProps)} />
  );
  Wrapped.displayName = name;
  return Wrapped;
}

export const Activity = /*#__PURE__*/ make(PhPulse, "duotone", "Activity");
export const AlertCircle = /*#__PURE__*/ make(PhWarningCircle, "duotone", "AlertCircle");
export const AlertOctagon = /*#__PURE__*/ make(PhWarningOctagon, "duotone", "AlertOctagon");
export const AlertTriangle = /*#__PURE__*/ make(PhWarning, "duotone", "AlertTriangle");
export const ArrowDownLeft = /*#__PURE__*/ make(PhArrowDownLeft, "bold", "ArrowDownLeft");
export const ArrowLeft = /*#__PURE__*/ make(PhArrowLeft, "bold", "ArrowLeft");
export const ArrowRight = /*#__PURE__*/ make(PhArrowRight, "bold", "ArrowRight");
export const ArrowUp = /*#__PURE__*/ make(PhArrowUp, "bold", "ArrowUp");
export const ArrowUpRight = /*#__PURE__*/ make(PhArrowUpRight, "bold", "ArrowUpRight");
export const Award = /*#__PURE__*/ make(PhMedal, "duotone", "Award");
export const BadgeAlert = /*#__PURE__*/ make(PhSealWarning, "duotone", "BadgeAlert");
export const BarChart3 = /*#__PURE__*/ make(PhChartBar, "duotone", "BarChart3");
export const BookOpen = /*#__PURE__*/ make(PhBookOpen, "duotone", "BookOpen");
export const Bot = /*#__PURE__*/ make(PhRobot, "duotone", "Bot");
export const Box = /*#__PURE__*/ make(PhCube, "duotone", "Box");
export const Boxes = /*#__PURE__*/ make(PhPackage, "duotone", "Boxes");
export const Briefcase = /*#__PURE__*/ make(PhBriefcase, "duotone", "Briefcase");
export const Building = /*#__PURE__*/ make(PhBuildings, "duotone", "Building");
export const Building2 = /*#__PURE__*/ make(PhBuildingOffice, "duotone", "Building2");
export const Calculator = /*#__PURE__*/ make(PhCalculator, "duotone", "Calculator");
export const Calendar = /*#__PURE__*/ make(PhCalendar, "duotone", "Calendar");
export const CalendarCheck = /*#__PURE__*/ make(PhCalendarCheck, "duotone", "CalendarCheck");
export const Camera = /*#__PURE__*/ make(PhCamera, "duotone", "Camera");
export const Check = /*#__PURE__*/ make(PhCheck, "bold", "Check");
export const CheckCircle = /*#__PURE__*/ make(PhCheckCircle, "duotone", "CheckCircle");
export const CheckCircle2 = /*#__PURE__*/ make(PhCheckCircle, "duotone", "CheckCircle2");
export const CheckSquare = /*#__PURE__*/ make(PhCheckSquare, "duotone", "CheckSquare");
export const ChevronDown = /*#__PURE__*/ make(PhCaretDown, "bold", "ChevronDown");
export const ChevronLeft = /*#__PURE__*/ make(PhCaretLeft, "bold", "ChevronLeft");
export const ChevronRight = /*#__PURE__*/ make(PhCaretRight, "bold", "ChevronRight");
export const ClipboardCheck = /*#__PURE__*/ make(PhClipboardText, "duotone", "ClipboardCheck");
export const ClipboardList = /*#__PURE__*/ make(PhListChecks, "duotone", "ClipboardList");
export const Clock = /*#__PURE__*/ make(PhClock, "duotone", "Clock");
export const Coins = /*#__PURE__*/ make(PhCoins, "duotone", "Coins");
export const Columns = /*#__PURE__*/ make(PhColumns, "duotone", "Columns");
export const Compass = /*#__PURE__*/ make(PhCompass, "duotone", "Compass");
export const Copy = /*#__PURE__*/ make(PhCopy, "bold", "Copy");
export const Cpu = /*#__PURE__*/ make(PhCpu, "duotone", "Cpu");
export const CreditCard = /*#__PURE__*/ make(PhCreditCard, "duotone", "CreditCard");
export const DollarSign = /*#__PURE__*/ make(PhCurrencyInr, "duotone", "DollarSign");
export const Download = /*#__PURE__*/ make(PhDownloadSimple, "bold", "Download");
export const Edit3 = /*#__PURE__*/ make(PhPencilSimple, "bold", "Edit3");
export const ExternalLink = /*#__PURE__*/ make(PhArrowSquareOut, "bold", "ExternalLink");
export const Eye = /*#__PURE__*/ make(PhEye, "bold", "Eye");
export const EyeOff = /*#__PURE__*/ make(PhEyeSlash, "bold", "EyeOff");
export const Factory = /*#__PURE__*/ make(PhFactory, "duotone", "Factory");
export const FileCheck = /*#__PURE__*/ make(PhFileText, "duotone", "FileCheck");
export const FileCheck2 = /*#__PURE__*/ make(PhFiles, "duotone", "FileCheck2");
export const FileCode = /*#__PURE__*/ make(PhFileCode, "duotone", "FileCode");
export const FileEdit = /*#__PURE__*/ make(PhNotePencil, "duotone", "FileEdit");
export const FilePlus = /*#__PURE__*/ make(PhFilePlus, "duotone", "FilePlus");
export const FileSignature = /*#__PURE__*/ make(PhSignature, "duotone", "FileSignature");
export const FileSpreadsheet = /*#__PURE__*/ make(PhFileXls, "duotone", "FileSpreadsheet");
export const FileText = /*#__PURE__*/ make(PhFileText, "duotone", "FileText");
export const Filter = /*#__PURE__*/ make(PhFunnel, "bold", "Filter");
export const Flag = /*#__PURE__*/ make(PhFlag, "duotone", "Flag");
export const Flame = /*#__PURE__*/ make(PhFire, "duotone", "Flame");
export const Gauge = /*#__PURE__*/ make(PhGauge, "duotone", "Gauge");
export const GitCommit = /*#__PURE__*/ make(PhGitCommit, "duotone", "GitCommit");
export const Globe = /*#__PURE__*/ make(PhGlobe, "duotone", "Globe");
export const Handshake = /*#__PURE__*/ make(PhHandshake, "duotone", "Handshake");
export const HardHat = /*#__PURE__*/ make(PhHardHat, "duotone", "HardHat");
export const Hash = /*#__PURE__*/ make(PhHash, "bold", "Hash");
export const HelpCircle = /*#__PURE__*/ make(PhQuestion, "duotone", "HelpCircle");
export const History = /*#__PURE__*/ make(PhClockCounterClockwise, "duotone", "History");
export const Info = /*#__PURE__*/ make(PhInfo, "duotone", "Info");
export const Landmark = /*#__PURE__*/ make(PhBank, "duotone", "Landmark");
export const Layers = /*#__PURE__*/ make(PhStack, "duotone", "Layers");
export const Layers3 = /*#__PURE__*/ make(PhStackSimple, "duotone", "Layers3");
export const LayoutDashboard = /*#__PURE__*/ make(PhSquaresFour, "duotone", "LayoutDashboard");
export const LayoutGrid = /*#__PURE__*/ make(PhGridFour, "duotone", "LayoutGrid");
export const LayoutList = /*#__PURE__*/ make(PhListDashes, "duotone", "LayoutList");
export const ListChecks = /*#__PURE__*/ make(PhListChecks, "duotone", "ListChecks");
export const Loader2 = /*#__PURE__*/ make(PhCircleNotch, "bold", "Loader2");
export const Lock = /*#__PURE__*/ make(PhLockSimple, "bold", "Lock");
export const LogOut = /*#__PURE__*/ make(PhSignOut, "bold", "LogOut");
export const Mail = /*#__PURE__*/ make(PhEnvelopeSimple, "duotone", "Mail");
export const MapPin = /*#__PURE__*/ make(PhMapPin, "duotone", "MapPin");
export const Menu = /*#__PURE__*/ make(PhList, "bold", "Menu");
export const Moon = /*#__PURE__*/ make(PhMoon, "duotone", "Moon");
export const MoreVertical = /*#__PURE__*/ make(PhDotsThreeVertical, "bold", "MoreVertical");
export const PackageCheck = /*#__PURE__*/ make(PhPackage, "duotone", "PackageCheck");
export const Palette = /*#__PURE__*/ make(PhPalette, "duotone", "Palette");
export const PanelLeft = /*#__PURE__*/ make(PhSidebarSimple, "duotone", "PanelLeft");
export const PanelLeftClose = /*#__PURE__*/ make(PhSidebarSimple, "duotone", "PanelLeftClose");
export const Paperclip = /*#__PURE__*/ make(PhPaperclip, "duotone", "Paperclip");
export const Pause = /*#__PURE__*/ make(PhPause, "bold", "Pause");
export const Percent = /*#__PURE__*/ make(PhPercent, "bold", "Percent");
export const Phone = /*#__PURE__*/ make(PhPhone, "duotone", "Phone");
export const PhoneCall = /*#__PURE__*/ make(PhPhoneCall, "duotone", "PhoneCall");
export const Pill = /*#__PURE__*/ make(PhPill, "duotone", "Pill");
export const Play = /*#__PURE__*/ make(PhPlay, "bold", "Play");
export const Plus = /*#__PURE__*/ make(PhPlus, "bold", "Plus");
export const Power = /*#__PURE__*/ make(PhPower, "duotone", "Power");
export const Printer = /*#__PURE__*/ make(PhPrinter, "duotone", "Printer");
export const Receipt = /*#__PURE__*/ make(PhReceipt, "duotone", "Receipt");
export const RefreshCw = /*#__PURE__*/ make(PhArrowsClockwise, "bold", "RefreshCw");
export const Repeat = /*#__PURE__*/ make(PhRepeat, "bold", "Repeat");
export const Rows = /*#__PURE__*/ make(PhRows, "duotone", "Rows");
export const Ruler = /*#__PURE__*/ make(PhRuler, "duotone", "Ruler");
export const Save = /*#__PURE__*/ make(PhFloppyDisk, "duotone", "Save");
export const Scale = /*#__PURE__*/ make(PhScales, "duotone", "Scale");
export const Search = /*#__PURE__*/ make(PhMagnifyingGlass, "bold", "Search");
export const SearchX = /*#__PURE__*/ make(PhMagnifyingGlassMinus, "bold", "SearchX");
export const Send = /*#__PURE__*/ make(PhPaperPlaneTilt, "bold", "Send");
export const Settings = /*#__PURE__*/ make(PhGearSix, "duotone", "Settings");
export const Shield = /*#__PURE__*/ make(PhShield, "duotone", "Shield");
export const ShieldAlert = /*#__PURE__*/ make(PhShieldWarning, "duotone", "ShieldAlert");
export const ShieldCheck = /*#__PURE__*/ make(PhShieldCheck, "duotone", "ShieldCheck");
export const ShoppingBag = /*#__PURE__*/ make(PhShoppingBag, "duotone", "ShoppingBag");
export const Signature = /*#__PURE__*/ make(PhSignature, "duotone", "Signature");
export const Sliders = /*#__PURE__*/ make(PhSliders, "duotone", "Sliders");
export const SlidersHorizontal = /*#__PURE__*/ make(PhSlidersHorizontal, "duotone", "SlidersHorizontal");
export const Sparkles = /*#__PURE__*/ make(PhSparkle, "duotone", "Sparkles");
export const Star = /*#__PURE__*/ make(PhStar, "duotone", "Star");
export const Sun = /*#__PURE__*/ make(PhSun, "duotone", "Sun");
export const Table = /*#__PURE__*/ make(PhTable, "duotone", "Table");
export const Tag = /*#__PURE__*/ make(PhTag, "duotone", "Tag");
export const Trash2 = /*#__PURE__*/ make(PhTrash, "bold", "Trash2");
export const TrendingDown = /*#__PURE__*/ make(PhTrendDown, "duotone", "TrendingDown");
export const TrendingUp = /*#__PURE__*/ make(PhTrendUp, "duotone", "TrendingUp");
export const Truck = /*#__PURE__*/ make(PhTruck, "duotone", "Truck");
export const Unlock = /*#__PURE__*/ make(PhLockSimpleOpen, "bold", "Unlock");
export const Upload = /*#__PURE__*/ make(PhUploadSimple, "bold", "Upload");
export const User = /*#__PURE__*/ make(PhUser, "duotone", "User");
export const UserCheck = /*#__PURE__*/ make(PhUserCheck, "duotone", "UserCheck");
export const UserX = /*#__PURE__*/ make(PhUserMinus, "duotone", "UserX");
export const Users = /*#__PURE__*/ make(PhUsers, "duotone", "Users");
export const Wrench = /*#__PURE__*/ make(PhWrench, "duotone", "Wrench");
export const X = /*#__PURE__*/ make(PhX, "bold", "X");
export const XCircle = /*#__PURE__*/ make(PhXCircle, "duotone", "XCircle");
export const ArrowRightLeft = /*#__PURE__*/ make(PhArrowsLeftRight, "duotone", "ArrowRightLeft");
export const Bell = /*#__PURE__*/ make(PhBell, "duotone", "Bell");
export const FileSearch = /*#__PURE__*/ make(PhFileMagnifyingGlass, "duotone", "FileSearch");
export const LogIn = /*#__PURE__*/ make(PhSignIn, "duotone", "LogIn");
export const MessageSquare = /*#__PURE__*/ make(PhChatCircle, "duotone", "MessageSquare");
export const PenTool = /*#__PURE__*/ make(PhPen, "duotone", "PenTool");
export const ShoppingCart = /*#__PURE__*/ make(PhShoppingCart, "duotone", "ShoppingCart");
export const UserPlus = /*#__PURE__*/ make(PhUserPlus, "duotone", "UserPlus");
export const Zap = /*#__PURE__*/ make(PhLightning, "duotone", "Zap");
