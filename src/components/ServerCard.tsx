import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import ServerFlag from "@/components/ServerFlag";
import ServerUsageBar from "@/components/ServerUsageBar";
import { formatBytes } from "@/lib/format";
import {
	GetFontLogoClass,
	GetOsName,
	MageMicrosoftWindows,
} from "@/lib/logo-class";
import {
	cn,
	formatNezhaInfo,
	parsePublicNote,
	getDaysBetweenDatesWithAutoRenewal,
} from "@/lib/utils";
import type { CycleTransferData, NezhaServer } from "@/types/nezha-api";

import PlanInfo from "./PlanInfo";
import BillingInfo from "./billingInfo";
import { Card, CardContent, CardFooter } from "./ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./ui/tooltip";
import { ArrowUp, Clock, Cpu, HardDrive, Server, BarChart3 } from "lucide-react";

interface ServerCardProps {
	now: number;
	serverInfo: NezhaServer;
	cycleStats?: {
		[key: string]: CycleTransferData;
	};
	groupName?: string;
}

export default function ServerCard({
	now,
	serverInfo,
	cycleStats,
	groupName,
}: ServerCardProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const {
		name,
		country_code,
		online,
		cpu,
		up,
		down,
		mem,
		stg,
		net_in_transfer,
		net_out_transfer,
		public_note,
		platform,
		cpu_info,
		mem_total,
		disk_total,
		tcp,
		udp,
		process,
		uptime,
		arch,
		swap,
		swap_total,
		load_1,
		load_5,
		load_15,
	} = formatNezhaInfo(now, serverInfo);

	const cardClick = () => {
		sessionStorage.setItem("fromMainPage", "true");
		navigate(`/server/${serverInfo.id}`);
	};

	const showFlag = true;

	const parsedData = parsePublicNote(public_note);

	// 获取匹配当前服务器的流量计费周期
	const getServerCycleData = () => {
		if (!cycleStats) {
			return null;
		}

		const serverId = String(serverInfo.id);
		const serverIdNum = Number(serverInfo.id);

		const matchedCycles: Array<{
			name: string;
			from: string;
			to: string;
			max: number;
			transfer: number;
			nextUpdate: string;
			progress: number;
		}> = [];

		Object.values(cycleStats).forEach((cycleData) => {
			if (!cycleData.server_name) {
				return;
			}

			const serverIdsInCycle = Object.keys(cycleData.server_name);

			let matchedId = null;

			if (serverIdsInCycle.includes(serverId)) {
				matchedId = serverId;
			} else if (serverIdsInCycle.includes(String(serverIdNum))) {
				matchedId = String(serverIdNum);
			} else {
				const serverNames = Object.entries(cycleData.server_name);
				for (const [id, name] of serverNames) {
					if (name === serverInfo.name) {
						matchedId = id;
						break;
					}
				}

				if (!matchedId) {
					for (const id of serverIdsInCycle) {
						if (Number(id) === serverIdNum) {
							matchedId = id;
							break;
						}
					}
				}
			}

			if (
				matchedId &&
				cycleData.transfer &&
				cycleData.transfer[matchedId] !== undefined
			) {
				const transfer = cycleData.transfer[matchedId];
				const progress = (transfer / cycleData.max) * 100;

				matchedCycles.push({
					name: cycleData.name,
					from: cycleData.from,
					to: cycleData.to,
					max: cycleData.max,
					transfer: transfer,
					nextUpdate: cycleData.next_update?.[matchedId] || "",
					progress: progress,
				});
			}
		});

		return matchedCycles.length > 0 ? matchedCycles : null;
	};

	const serverCycleData = getServerCycleData();

	// 格式化运行时间
	const formatUptime = (seconds: number, t: any) => {
		if (seconds >= 86400) {
			return `${Math.floor(seconds / 86400)} ${t("serverCard.days")}`;
		} else {
			return `${Math.floor(seconds / 3600)} ${t("serverCard.hours")}`;
		}
	};

	// 格式化网络速度
	const formatSpeed = (speed: number) => {
		return speed >= 1024
			? `${(speed / 1024).toFixed(2)}G/s`
			: speed >= 1
				? `${speed.toFixed(2)}M/s`
				: `${(speed * 1024).toFixed(2)}K/s`;
	};

	// 根据进度获取状态颜色
	const getProgressColorClass = (value: number) => {
		if (value > 90) return "bg-red-500";
		if (value > 70) return "bg-orange-500";
		return "bg-emerald-500";
	};

	// 格式化大数值
	const formatLargeNumber = (num: number) => {
		if (num >= 10000) {
			return `${Math.floor(num / 1000)}k+`;
		} else if (num >= 1000) {
			return `${(num / 1000).toFixed(1)}k`;
		}
		return num.toString();
	};

	if (!online) {
		return (
			<Card
				className="cursor-pointer transition-all duration-300 border-red-300/40"
				onClick={cardClick}
			>
				{groupName && (
					<div className="absolute top-2 right-2">
						<div className="px-1.5 py-0.5 text-[10px] sm:text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 rounded-sm border border-red-200 dark:border-red-800">
							{groupName}
						</div>
					</div>
				)}

				<CardContent className="p-3 sm:p-4 pt-5 sm:pt-6">
					<div className="flex items-center gap-2 sm:gap-3 mb-2">
						<span className="h-3 w-3 shrink-0 rounded-full bg-red-500 shadow-sm pulse-animation shadow-red-300 dark:shadow-red-900"></span>
						{showFlag && <ServerFlag country_code={country_code} />}
						<h3 className="font-bold text-sm sm:text-base truncate flex-1">
							{name}
						</h3>
					</div>

					<div className="flex justify-between items-start">
						{parsedData?.billingDataMod && (
							<div className="mt-2">
								<BillingInfo parsedData={parsedData} />
							</div>
						)}

						{parsedData?.planDataMod && (
							<div className="mt-2">
								<PlanInfo parsedData={parsedData} />
							</div>
						)}
					</div>

					{serverCycleData && serverCycleData.length > 0 && (
						<div className="mt-3">
							{serverCycleData.map((cycle, index) => (
								<div
									key={index}
									className="mt-3 bg-white/5 dark:bg-black/5 backdrop-blur-sm rounded-md p-2 border border-white/10"
								>
									<div className="flex items-center justify-between mb-1">
										<div className="flex items-center">
											<BarChart3 className="size-[12px] mr-1 text-emerald-500" />
											<span className="text-xs font-medium">{cycle.name}</span>
										</div>
										<span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded backdrop-blur-sm">
											{new Date(cycle.from).toLocaleDateString()} -{" "}
											{new Date(cycle.to).toLocaleDateString()}
										</span>
									</div>
									<div className="flex justify-between items-center text-xs mt-1">
										<div className="flex items-baseline gap-1">
											<span className="font-medium text-xs">
												{formatBytes(cycle.transfer)}
											</span>
											<span className="text-[10px] text-muted-foreground">
												/ {formatBytes(cycle.max)}
											</span>
										</div>
										<span className="text-[10px] font-medium">
											{cycle.progress.toFixed(1)}%
										</span>
									</div>
									<div className="relative h-1 mt-1">
										<div className="absolute inset-0 bg-muted rounded-full" />
										<div
											className={cn(
												"absolute inset-0 rounded-full transition-all duration-300",
												getProgressColorClass(cycle.progress),
											)}
											style={{
												width: `${Math.min(cycle.progress, 100)}%`,
											}}
										/>
									</div>
									{cycle.nextUpdate && (
										<div className="mt-1 text-[10px] text-muted-foreground">
											{t("cycleTransfer.nextUpdate")}:{" "}
											{new Date(cycle.nextUpdate).toLocaleTimeString()}
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		);
	}

	return (
		<Card
			className="cursor-pointer transition-all duration-300 border-green-300/40"
			onClick={cardClick}
		>
			<CardContent className="p-4 relative">
				{/* 顶部：服务器名称和状态 */}
				<div className="flex items-center justify-between mb-2 sm:mb-3">
					<div className="flex items-center gap-2">
						{showFlag && <ServerFlag country_code={country_code} />}
						<h3 className="font-semibold text-sm sm:text-base truncate">
							{name}
						</h3>
						{groupName && (
							<div className="px-1.5 py-0.5 text-[10px] sm:text-xs font-medium bg-green-100 text-green-700 rounded">
								{groupName}
							</div>
						)}
					</div>

					<div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-muted-foreground">
						<div className="flex items-center">
							{platform.includes("Windows") ? (
								<MageMicrosoftWindows className="size-3 mr-1" />
							) : (
								<span
									className={`fl-${GetFontLogoClass(platform)} mr-1 text-xs`}
								/>
							)}
							<span className="truncate">
								{platform.includes("Windows")
									? "Win"
									: GetOsName(platform)}
							</span>
						</div>
						{arch && (
							<div className="bg-blue-100 text-blue-700 rounded px-1.5 py-0.5 text-[10px] sm:text-xs font-medium">
								{arch}
							</div>
						)}
						{uptime > 0 && (
							<div className="flex items-center">
								<Clock className="size-3 mr-1" />
								<span className="truncate">{formatUptime(uptime, t)}</span>
							</div>
						)}
					</div>
				</div>

				{/* 主要内容：响应式网格布局 */}
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2 auto-rows-max relative">
					{/* CPU */}
					<div className="bg-muted rounded-md p-1.5 sm:p-2 border border-border">
						<div className="flex items-center justify-between mb-1 sm:mb-2">
							<div className="flex items-center gap-1.5">
								<Cpu className="size-3 text-blue-600" />
								<span className="text-xs sm:text-sm font-medium">CPU</span>
							</div>
							<span className="text-xs sm:text-sm font-semibold">
								{cpu.toFixed(1)}%
							</span>
						</div>
						<ServerUsageBar value={cpu} />
						{cpu_info && cpu_info.length > 0 && (
							<div className="mt-2 flex gap-1">
								<div className="bg-gray-100 text-gray-700 rounded px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium flex-1 truncate">
									{cpu_info.join("\n")}
								</div>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="bg-blue-100 text-blue-700 rounded px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium">
												{cpu_info[0].includes("Physical")
													? "pCPU"
													: "vCPU"}
												:
												{cpu_info[0].match(
													/(\d+)\s+(?:Physical|Virtual)\s+Core/,
												)?.[1] || "-"}
											</div>
										</TooltipTrigger>
										<TooltipContent className="max-w-[250px] text-xs whitespace-pre-wrap p-2">
											{cpu_info.join("\n")}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
						)}
					</div>

					{/* 内存 */}
					<div className="bg-muted rounded-md p-1.5 sm:p-2 border border-border">
						<div className="flex items-center justify-between mb-1 sm:mb-2">
							<div className="flex items-center gap-1.5">
								<div className="size-3 text-purple-600 flex items-center justify-center">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="12"
										height="12"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M16 16H8V8H16V16Z"></path>
										<path d="M12 20V16"></path>
										<path d="M12 8V4"></path>
										<path d="M20 12H16"></path>
										<path d="M8 12H4"></path>
									</svg>
								</div>
								<span className="text-xs sm:text-sm font-medium">内存</span>
							</div>
							<span className="text-xs sm:text-sm font-semibold">
								{mem.toFixed(1)}%
							</span>
						</div>
						<ServerUsageBar value={mem} />
						<div className="mt-2 flex gap-1">
							<div className="bg-purple-100 text-purple-700 rounded px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium flex-1 text-center">
								{mem_total > 0
									? `${formatBytes((mem_total * mem) / 100)} / ${formatBytes(mem_total)}`
									: "-"}
							</div>
							{swap_total > 0 && (
								<div
									className={cn(
										"bg-indigo-100 text-indigo-700 rounded px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium",
										Number(swap) > 90
											? "bg-red-100 text-red-700"
											: Number(swap) > 70
												? "bg-orange-100 text-orange-700"
												: "",
									)}
								>
									SW:{swap.toFixed(0)}%
								</div>
							)}
						</div>
					</div>

					{/* 存储 */}
					<div className="bg-muted rounded-md p-1.5 sm:p-2 border border-border">
						<div className="flex items-center justify-between mb-1 sm:mb-2">
							<div className="flex items-center gap-1.5">
								<HardDrive className="size-3 text-amber-600" />
								<span className="text-xs sm:text-sm font-medium">存储</span>
							</div>
							<span className="text-xs sm:text-sm font-semibold">
								{stg.toFixed(1)}%
							</span>
						</div>
						<ServerUsageBar value={stg} />
						<div className="mt-2">
							<div className="bg-amber-100 text-amber-700 rounded px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium text-center">
								{disk_total > 0
									? `${formatBytes((disk_total * stg) / 100)} / ${formatBytes(disk_total)}`
									: "-"}
							</div>
						</div>
					</div>

					{/* 网络速率 */}
					<div className="bg-muted rounded-md p-1.5 sm:p-2 border border-border">
						<div className="flex items-center gap-1.5 mb-1 sm:mb-2">
							<ArrowUp className="size-3 text-blue-600" />
							<span className="text-xs sm:text-sm font-medium">网络速率</span>
						</div>
						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<span className="text-[9px] sm:text-[10px] text-muted-foreground">
									上传
								</span>
								<span className="text-xs sm:text-sm font-semibold">
									{formatSpeed(up)}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-[9px] sm:text-[10px] text-muted-foreground">
									下载
								</span>
								<span className="text-xs sm:text-sm font-semibold">
									{formatSpeed(down)}
								</span>
							</div>
						</div>
					</div>

					{/* 网络传输总量 */}
					<div className="hidden sm:block bg-muted rounded-md p-1.5 sm:p-2 border border-border">
						<div className="flex items-center gap-1.5 mb-1 sm:mb-2">
							<BarChart3 className="size-3 text-green-600" />
							<span className="text-xs sm:text-sm font-medium">总传输</span>
						</div>
						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<span className="text-[9px] sm:text-[10px] text-muted-foreground">
									上传
								</span>
								<span className="text-xs sm:text-sm font-semibold">
									{formatBytes(net_out_transfer)}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-[9px] sm:text-[10px] text-muted-foreground">
									下载
								</span>
								<span className="text-xs sm:text-sm font-semibold">
									{formatBytes(net_in_transfer)}
								</span>
							</div>
						</div>
					</div>

					{/* 流量使用统计 */}
					{serverCycleData &&
						serverCycleData.length > 0 &&
						serverCycleData.map((cycle, index) => (
							<div
								key={index}
								className="bg-muted rounded-md p-1.5 sm:p-2 border border-border col-span-2 sm:col-span-1"
							>
								<div className="flex items-center justify-between mb-1 sm:mb-2">
									<div className="flex items-center gap-1.5">
										<BarChart3 className="size-3 text-emerald-600" />
										<span className="text-xs sm:text-sm font-medium truncate">
											{cycle.name}
										</span>
									</div>
									<span className="text-[9px] sm:text-[10px] bg-emerald-100 text-emerald-700 px-1 sm:px-1.5 py-0.5 rounded font-medium">
										{cycle.progress.toFixed(1)}%
									</span>
								</div>
								<div className="flex justify-between items-center text-[9px] sm:text-[10px] mb-1">
									<span className="font-medium">
										{formatBytes(cycle.transfer)}
									</span>
									<span className="text-muted-foreground">
										/ {formatBytes(cycle.max)}
									</span>
								</div>
								<div className="relative h-1.5 bg-secondary rounded-full">
									<div
										className={cn(
											"absolute inset-0 rounded-full transition-all duration-300",
											getProgressColorClass(cycle.progress),
										)}
										style={{
											width: `${Math.min(cycle.progress, 100)}%`,
										}}
									/>
								</div>
							</div>
						))}

					{/* 账单信息 */}
					{parsedData?.billingDataMod &&
						(() => {
							const billing = parsedData.billingDataMod;
							let daysLeftObject = { days: 0, remainingPercentage: 0 };
							let isNeverExpire = false;

							if (billing.endDate?.startsWith("0000-00-00")) {
								isNeverExpire = true;
							} else if (billing.endDate) {
								try {
									daysLeftObject =
										getDaysBetweenDatesWithAutoRenewal(billing);
								} catch (error) {
									console.error("Error calculating billing days:", error);
								}
							}

							return (
								<div className="bg-muted rounded-md p-1.5 sm:p-2 border border-border col-span-2 sm:col-span-1">
									<div className="flex items-center gap-1.5 mb-1 sm:mb-2">
										<svg
											className="size-3 text-orange-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
											/>
										</svg>
										<span className="text-xs sm:text-sm font-medium">
											账单
										</span>
									</div>
									<div className="space-y-1">
										<div className="flex justify-between items-center">
											<div className="flex items-center gap-1">
												{billing.amount &&
												billing.amount !== "0" &&
												billing.amount !== "-1" ? (
													<span className="text-xs sm:text-sm font-semibold">
														{billing.amount}/{billing.cycle}
													</span>
												) : billing.amount === "0" ? (
													<span className="text-[9px] sm:text-[10px] bg-green-100 text-green-700 px-1 sm:px-1.5 py-0.5 rounded font-medium">
														免费
													</span>
												) : billing.amount === "-1" ? (
													<span className="text-[9px] sm:text-[10px] bg-pink-100 text-pink-700 px-1 sm:px-1.5 py-0.5 rounded font-medium">
														按量计费
													</span>
												) : null}
											</div>
											<div className="flex items-center gap-1">
												<span className="text-[9px] sm:text-[10px] text-muted-foreground">
													{daysLeftObject.days < 0 ? "已过期" : "剩余"}
												</span>
												<span
													className={`text-xs sm:text-sm font-semibold ${daysLeftObject.days < 0 ? "text-red-600" : "text-foreground"}`}
												>
													{isNeverExpire
														? "永久"
														: `${Math.abs(daysLeftObject.days)}天`}
												</span>
											</div>
										</div>
										{daysLeftObject.days >= 0 && (
											<div className="relative h-1 bg-secondary rounded-full mt-1">
												<div
													className={cn(
														"absolute inset-0 rounded-full transition-all duration-300",
														isNeverExpire
															? "bg-blue-500"
															: daysLeftObject.remainingPercentage > 0.3
																? "bg-green-500"
																: daysLeftObject.remainingPercentage > 0.1
																	? "bg-yellow-500"
																	: "bg-red-500",
													)}
													style={{
														width: isNeverExpire
															? "100%"
															: `${Math.max(daysLeftObject.remainingPercentage * 100, 2)}%`,
													}}
												/>
											</div>
										)}
									</div>
								</div>
							);
						})()}

					{/* 连接信息 */}
					<div className="hidden sm:block bg-muted rounded-md p-1.5 sm:p-2 border border-border">
						<div className="flex items-center gap-1.5 mb-1 sm:mb-2">
							<Server className="size-3 text-indigo-600" />
							<span className="text-xs sm:text-sm font-medium">连接</span>
						</div>
						<div className="grid grid-cols-3 gap-1 text-center">
							<div className="flex flex-col">
								<span className="text-[9px] sm:text-[10px] text-muted-foreground">
									TCP
								</span>
								<span className="text-xs sm:text-sm font-semibold">
									{formatLargeNumber(tcp)}
								</span>
							</div>
							<div className="flex flex-col">
								<span className="text-[9px] sm:text-[10px] text-muted-foreground">
									UDP
								</span>
								<span className="text-xs sm:text-sm font-semibold">
									{formatLargeNumber(udp)}
								</span>
							</div>
							<div className="flex flex-col">
								<span className="text-[9px] sm:text-[10px] text-muted-foreground">
									进程
								</span>
								<span className="text-xs sm:text-sm font-semibold">
									{formatLargeNumber(process)}
								</span>
							</div>
						</div>
					</div>
				</div>
			</CardContent>

			{/* 底部信息：套餐信息和负载 */}
			<CardFooter className="px-3 sm:px-4 pt-1.5 sm:pt-2 pb-2 sm:pb-3">
				<div className="flex items-center justify-between w-full">
					<div className="flex items-center gap-2">
						{parsedData?.planDataMod && <PlanInfo parsedData={parsedData} />}
					</div>

					<div className="flex items-center gap-1.5">
						<svg
							className="size-3 text-teal-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
						<div className="text-xs sm:text-sm">
							<span className="font-medium">负载:</span>
							<span className="ml-1">
								{load_1} / {load_5} / {load_15}
							</span>
						</div>
					</div>
				</div>
			</CardFooter>
		</Card>
	);
}
