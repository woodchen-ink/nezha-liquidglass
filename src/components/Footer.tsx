import type React from "react";

const Footer: React.FC = () => {
	return (
		<footer className="mx-auto w-full max-w-5xl px-4 lg:px-0 pb-4 server-footer">
			<section className="flex flex-col">
				<section className="mt-1 flex items-center sm:flex-row flex-col justify-between gap-2 text-[13px] font-light tracking-tight text-neutral-600/50 dark:text-neutral-300/50 server-footer-name">
					<div className="flex items-center gap-1">
						&copy;2020-{new Date().getFullYear()}{" "}
						<a href={"https://www.czl.net"} target="_blank">
							CZL LTD
						</a>
					</div>
					<div className="server-footer-theme flex flex-col items-center sm:items-end">
						<p className="server-footer-theme">All Rights Reserved</p>
					</div>
				</section>
			</section>
		</footer>
	);
};

export default Footer;
