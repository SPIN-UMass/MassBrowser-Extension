/*
 * This file is part of SmartProxy <https://github.com/salarcode/SmartProxy>,
 * Copyright (C) 2019 Salar Khalilzadeh <salar2k@gmail.com>
 *
 * SmartProxy is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * SmartProxy is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with SmartProxy.  If not, see <http://www.gnu.org/licenses/>.
 */
import { browser, environment } from "../lib/environment";
import { Debug } from "../lib/Debug";
import { ProxyModeType, BrowserProxySettingsType} from "./definitions"; //, ProxyRule, ProxyServer, SpecialRequestApplyProxyMode 
import { ProxyRules } from "./ProxyRules";
import { TabManager } from "./TabManager";
import { PolyFill } from "../lib/PolyFill";
import { Settings } from "./Settings";
//import { ProxyEngineSpecialRequests } from "./ProxyEngineSpecialRequests";

export class ProxyEngineFirefox {
	private static proxyScriptUrlFirefox = "core-engine-ff-pac.js";
	public static proxyScriptExtensionUrlFirefox = browser.runtime.getURL("core-engine-ff-pac.js");

	/** If Firefox API available, registers proxy */
	public static register(): boolean {
		if (browser["proxy"] && browser.proxy["onRequest"]) {

			// onRequest is Used for HTTP and HTTPS protocols only (WSS included), source: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/RequestFilter
			// Smart features are available here only
			browser.proxy.onRequest.addListener(ProxyEngineFirefox.handleProxyRequest,
				{ urls: ['*://*/*', 'ws://*/*', 'wss://*/*', 'ftp://*/*'] });

			// PAC script is used for Ftp and other protocols
			if (browser.proxy["register"])
				browser.proxy.register(ProxyEngineFirefox.proxyScriptUrlFirefox);

			browser.proxy.onError.addListener(ProxyEngineFirefox.onProxyError);

			return true;
		}
		return false;
	}

	public static updateFirefoxProxyConfig() {
		// let settings = Settings.current;
		let proxySettings = {
			proxyType: BrowserProxySettingsType.system
		};

		proxySettings.proxyType = BrowserProxySettingsType.none;

		PolyFill.browserSetProxySettings(
			{
				value: proxySettings
			},
			null,
			function (error: Error) {
				Debug.log("updateFirefoxProxyConfig failed to set proxy settings", proxySettings, error);
				if (error && error["message"]) {
					if (error.message.includes("not supported"))
						environment.notSupported.setProxySettings = true;
					if (error.message.includes("permission"))
						environment.notAllowed.setProxySettings = true;
				}
			});
	}


	private static handleProxyRequest(requestDetails: any) {
		/* requestDetails->
			documentUrl: "http://socialshare.ir/admin/media-promote"
			frameAncestors: undefined
			frameId: 0
			fromCache: false
			method: "GET"
			originUrl: "http://socialshare.ir/admin/media-promote"
			parentFrameId: -1
			requestId: "2752"
			tabId: -1
			timeStamp: 1545452060641
			type: "speculative"
			url: "http://socialshare.ir/admin/media-promote"
			*/

		let settings = Settings.current;

		if (!requestDetails.url || requestDetails.url == 'localhost' || requestDetails.url == '127.0.0.1' )
			return { type: "direct" };

		// checking if request is special
		// let specialRequest = ProxyEngineSpecialRequests.getProxyMode(requestDetails.url, true);
		// if (specialRequest !== null) {
		// 	if (specialRequest.applyMode == SpecialRequestApplyProxyMode.NoProxy)
		// 		return { type: "direct" };

		// 	if (specialRequest.applyMode == SpecialRequestApplyProxyMode.CurrentProxy) {
		// 		if (settings.activeProxyServer)
		// 			return ProxyEngineFirefox.getResultProxyInfo(settings.activeProxyServer);
		// 		else
		// 			return { type: "direct" };
		// 	}

		// 	if (specialRequest.applyMode == SpecialRequestApplyProxyMode.SelectedProxy
		// 		&& specialRequest.selectedProxy) {
		// 		return ProxyEngineFirefox.getResultProxyInfo(specialRequest.selectedProxy);
		// 	}
		// }

		if (settings.proxyMode == ProxyModeType.Direct)
			return { type: "direct" };

		

		if (settings.proxyMode == ProxyModeType.Tor) {
			

			return ProxyEngineFirefox.getResultTorProxy();
		}

		if (settings.proxyMode == ProxyModeType.SmartProxy) {

			let tabData = TabManager.getTab(requestDetails.tabId);
		
			let matched = ProxyRules.findMatchForUrl(tabData.url);	
			console.log("MMM",matched,requestDetails.url);
			if (matched && matched.enabled)  {
				return ProxyEngineFirefox.getResultTorProxy();

			}
			
			return ProxyEngineFirefox.getResultMassProxy();
		}

		

		// nothing matched
		return ProxyEngineFirefox.getResultMassProxy();
	}

	// private static storeTabProxyDetail(requestDetails: any, matchedRule: ProxyRule) {
	// 	// check if this is the top level request
	// 	if (requestDetails.type !== "main_frame") {
	// 		return;
	// 	}

	// 	// tab is new, we need to create it
	// 	let tabData = TabManager.getOrSetTab(requestDetails.tabId, true, requestDetails.url);
	// 	if (tabData == null) {
	// 		// never
	// 		return;
	// 	}

	// 	// only the top-level
	// 	if (requestDetails.url === tabData.url) {

	// 		tabData.proxified = true;
	// 		tabData.proxySourceDomain = matchedRule.sourceDomain;
	// 		if (matchedRule.proxy)
	// 			tabData.proxyServerFromRule = matchedRule.proxy;
	// 		else
	// 			tabData.proxyServerFromRule = null;
	// 	}
	// }

	private static getResultTorProxy() {
		
				return {
					type: "socks",
					host: 'localhost',
					port: Settings.current.options.TorPort,
					proxyDNS: true,
					username: '',
					password: ''
				};

		
		
	}
	private static getResultMassProxy() {
		
		return {
			type: "socks",
			host: 'localhost',
			port: Settings.current.options.MassPort,
			proxyDNS: true,
			username: '',
			password: ''
		};



}


	private static onProxyError(error: Error) {
		Debug.error(`Proxy error: ${error.message}`, error);
	}
}