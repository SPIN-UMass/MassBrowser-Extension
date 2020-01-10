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
import { CommonUi } from "./CommonUi";
import { PolyFill } from "../../lib/PolyFill";
import { messageBox, jQuery } from "../../lib/External";
import { environment, browser } from "../../lib/environment";
import { Utils } from "../../lib/Utils";
import { ProxyImporter } from "../../lib/ProxyImporter";
import { RuleImporter } from "../../lib/RuleImporter";
import { SettingsConfig, Messages, SettingsPageInternalDataType, proxyServerProtocols, proxyServerSubscriptionObfuscate, ProxyServer, ProxyRule, ProxyRuleType, ProxyServerSubscription, GeneralOptions, BypassOptions, ResultHolder, proxyServerSubscriptionFormat, SpecialRequestApplyProxyMode, specialRequestApplyProxyModeKeys } from "../../core/definitions";

export class settingsPage {

    private static grdServers: any;
    private static grdRules: any;
    private static grdServerSubscriptions: any;
    private static currentSettings: SettingsConfig;

    /** Used to track changes and restore when reject changes selected */
    private static originalSettings: SettingsConfig;

    private static changeTracking = {
        options: false,
        rules: false,
        servers: false,
        activeProxy: false,
        serverSubscriptions: false,
        bypass: false
    };

    public static initialize() {

        CommonUi.onDocumentReady(CommonUi.localizeHtmlPage);
        CommonUi.onDocumentReady(settingsPage.resizableMenu);

        CommonUi.onDocumentReady(this.bindEvents);
        CommonUi.onDocumentReady(this.initializeGrids);
        CommonUi.onDocumentReady(this.initializeUi);

        PolyFill.runtimeSendMessage(Messages.SettingsPageGetInitialData,
            (dataForSettings: SettingsPageInternalDataType) => {
                if (!dataForSettings)
                    return;

                settingsPage.populateDataForSettings(dataForSettings);
            },
            (error: Error) => {
                PolyFill.runtimeSendMessage("SettingsPageGetInitialData failed! > " + error);
                messageBox.error(browser.i18n.getMessage("settingsInitializeFailed"));
            });

    }

    private static populateDataForSettings(settingsData: SettingsPageInternalDataType) {
        this.currentSettings = settingsData.settings;
        this.populateSettingsUiData(settingsData);

        this.loadRules(this.currentSettings.proxyRules);
        
        this.loadGeneralOptions(this.currentSettings.options);

        // make copy
        this.originalSettings = new SettingsConfig();
        this.originalSettings.proxyRules = this.currentSettings.proxyRules.slice();
        this.originalSettings.proxyServers = this.currentSettings.proxyServers.slice();
        this.originalSettings.activeProxyServer = this.currentSettings.activeProxyServer;
        this.originalSettings.proxyServerSubscriptions = this.currentSettings.proxyServerSubscriptions;
        this.originalSettings.bypass = jQuery.extend({}, this.currentSettings.bypass);
        this.originalSettings.options = jQuery.extend({}, this.currentSettings.options);
    }

    private static bindEvents() {
        // general options
        jQuery("#btnSaveGeneralOptions").click(settingsPage.uiEvents.onClickSaveGeneralOptions);

        jQuery("#btnRejectGeneralOptions").click(settingsPage.uiEvents.onClickRejectGeneralOptions);



        jQuery("#btnIgnoreRequestFailuresForDomains").click

        

        

        // proxy servers
        

        
        // rules
        jQuery("#cmdRuleType").change(settingsPage.uiEvents.onChangeRuleType);

        jQuery("#chkRuleGeneratePattern").change(settingsPage.uiEvents.onChangeRuleGeneratePattern);

        jQuery("#btnSubmitRule").click(settingsPage.uiEvents.onClickSubmitProxyRule);

        

        jQuery("#btnAddProxyRule").click(settingsPage.uiEvents.onClickAddProxyRule);

        jQuery("#btnAddProxyMultipleRule").click(settingsPage.uiEvents.onClickAddProxyMultipleRule);

        jQuery("#btnSubmitMultipleRule").click(settingsPage.uiEvents.onClickSubmitMultipleRule);

        jQuery("#btnSaveProxyRules").click(settingsPage.uiEvents.onClickSaveProxyRules);

        jQuery("#btnRejectProxyRules").click(settingsPage.uiEvents.onClickRejectProxyRules);

        jQuery("#btnClearProxyRules").click(settingsPage.uiEvents.onClickClearProxyRules);

        
    }

    private static initializeGrids() {

        let dataTableCustomDom = '<t><"row"<"col-sm-12 col-md-5"<"text-left float-left"f>><"col-sm-12 col-md-7"<"text-right"l>>><"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>';

        // settingsPage.grdServers = jQuery("#grdServers").DataTable({
        //     "dom": dataTableCustomDom,
        //     paging: true,
        //     select: true,
        //     scrollY: 300,
        //     responsive: true,
        //     lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
        //     columns: [
        //         {
        //             name: "name", data: "name", title: browser.i18n.getMessage("settingsServersGridColName")
        //         },
        //         {
        //             name: "protocol", data: "protocol", title: browser.i18n.getMessage("settingsServersGridColProtocol"),
        //         },
        //         {
        //             name: "host", data: "host", title: browser.i18n.getMessage("settingsServersGridColServer"),
        //         },
        //         {
        //             name: "port", data: "port", type: "num", title: browser.i18n.getMessage("settingsServersGridColPort"),
        //         },
        //         {
        //             "data": null,
        //             "defaultContent": "<button class='btn btn-sm btn-success' id='btnServersEdit'>Edit</button> <button class='btn btn-sm btn-danger' id='btnServersRemove'><i class='fas fa-times'></button>",
        //         }
        //     ],
        // });
        // settingsPage.grdServers.on('responsive-display',
        //     function (e, dataTable, row, showHide, update) {
        //         let rowChild = row.child();
        //         if (showHide && rowChild && rowChild.length)
        //             settingsPage.refreshServersGridRowElement(rowChild[0]);
        //     }
        // );
        // settingsPage.grdServers.draw();
        settingsPage.grdRules = jQuery("#grdRules").DataTable({
            "dom": dataTableCustomDom,
            paging: true,
            select: true,
            scrollY: 300,
            responsive: true,
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
            columns: [
                {
                    name: "sourceDomain", data: "sourceDomain", title: browser.i18n.getMessage("settingsRulesGridColSource")
                },
                {
                    name: "rule", data: "rule", title: browser.i18n.getMessage("settingsRulesGridColRule")
                },
                {
                    name: "enabled", data: "enabled", title: browser.i18n.getMessage("settingsRulesGridColEnabled")
                },
                {
                    width: "70px",
                    "data": null,
                    "defaultContent": "<button class='btn btn-sm btn-success' id='btnRulesEdit'>Edit</button> <button class='btn btn-sm btn-danger' id='btnRulesRemove'><i class='fas fa-times'></button>",
                }
            ],
        });
        settingsPage.grdRules.on('responsive-display',
            function (e, dataTable, row, showHide, update) {
                let rowChild = row.child();
                if (showHide && rowChild && rowChild.length)
                    settingsPage.refreshRulesGridRowElement(rowChild[0]);
            }
        );
        settingsPage.grdRules.draw();

       
        
        
        if (settingsPage.currentSettings) {
            
            if (settingsPage.currentSettings.proxyRules)
                settingsPage.loadRules(settingsPage.currentSettings.proxyRules);


        }
        else {
            settingsPage.loadRules([]);
        }

        jQuery("#tabSettings").on('shown.bs.tab', (e: any) => {
            // DataTables columns are not adjusted when hidden, needs to be done manually
            settingsPage.grdRules.columns.adjust().draw();
        });
    }

    private static initializeUi() {
        if (environment.chrome) {
            jQuery("#divAlertChrome").show();
            jQuery(".firefox-only").hide();
            jQuery(".chrome-only").show();
        } else {
            jQuery("#divAlertFirefox").show();
            jQuery(".firefox-only").show();
            jQuery(".chrome-only").hide();
        }

        // the default values
        let cmbServerSubscriptionProtocol = jQuery("#cmbServerSubscriptionProtocol");

        // the default values
        let cmbServerSubscriptionObfuscation = jQuery("#cmbServerSubscriptionObfuscation");


        jQuery("<option>").attr("value", "")
            // (Auto detect with HTTP fallback)
            .text(browser.i18n.getMessage("settingsServerSubscriptionProtocolDefault"))
            .appendTo(cmbServerSubscriptionProtocol);
        proxyServerProtocols.forEach(item => {
            jQuery("<option>").attr("value", item)
                .text(item)
                .appendTo(cmbServerSubscriptionProtocol);
        });

        proxyServerSubscriptionObfuscate.forEach(item => {
            jQuery("<option>").attr("value", item)
                .text(item)
                .appendTo(cmbServerSubscriptionObfuscation);
        });

        let cmbServerSubscriptionFormat = jQuery("#cmbServerSubscriptionFormat");
        proxyServerSubscriptionFormat.forEach((item, index) => {
            jQuery("<option>").attr("value", index)
                .text(item)
                .appendTo(cmbServerSubscriptionFormat);
        });

        let cmbServerSubscriptionApplyProxy = jQuery("#cmbServerSubscriptionApplyProxy");
        specialRequestApplyProxyModeKeys.forEach((item, index) => {
            jQuery("<option>").attr("value", index)
                .text(browser.i18n.getMessage("settingsServerSubscriptionApplyProxy_" + item))
                .appendTo(cmbServerSubscriptionApplyProxy);
        });
        if (environment.chrome)
            cmbServerSubscriptionApplyProxy.attr("disabled", "disabled");
    }

    private static resizableMenu() {

        var alterMenuCss = function () {
            var ww = document.body.clientWidth;
            // sm = 576px
            if (ww < 576) {
                jQuery('#tabSettings').removeClass('flex-column');
            } else if (ww >= 576) {
                jQuery('#tabSettings').addClass('flex-column');
            };
        };
        jQuery(window).resize(function () {
            alterMenuCss();
        });

        //Fire it when the page first loads:
        alterMenuCss();
    }

    //#region Populate UI ----------------------

    /** Display General UI data */
    private static populateSettingsUiData(settingsData: SettingsPageInternalDataType) {
        let currentSettings = settingsData.settings;

        let divNoServersWarning = jQuery("#divNoServersWarning");
        if (currentSettings.proxyServers.length > 0 ||
            (currentSettings.proxyServerSubscriptions && currentSettings.proxyServerSubscriptions.length > 0)) {

            divNoServersWarning.hide();
        } else {
            divNoServersWarning.show();
        }

        jQuery("#spanVersion").text("Version: " + currentSettings.version);

        if (settingsData.updateAvailableText && settingsData.updateInfo) {
            jQuery("#divUpdateIsAvailable").show()
                .find("a")
                .attr("href", settingsData.updateInfo.downloadPage)
                .find("span")
                .text(settingsData.updateAvailableText);
        }
    }

    /** Used for ActiveProxy and ... */
   
    private static readServerModel(modalContainer: any): ProxyServer {
        let proxy = new ProxyServer();

        proxy.name = modalContainer.find("#txtServerName").val().trim();
        proxy.host = modalContainer.find("#txtServerAddress").val().trim();
        proxy.port = modalContainer.find("#txtServerPort").val();
        proxy.protocol = modalContainer.find("#cmdServerProtocol").val();
        proxy.username = modalContainer.find("#txtServerUsername").val().trim();
        proxy.password = modalContainer.find("#txtServerPassword").val().trim();
        proxy.proxyDNS = modalContainer.find("#chkServerProxyDNS").prop("checked");

        return proxy;
    }

    private static populateRuleModal(modalContainer: any, proxyRule?: ProxyRule) {
        // populate servers
        let cmdRuleProxyServer = modalContainer.find("#cmdRuleProxyServer");
        cmdRuleProxyServer.empty();

        // the default value which is empty string
        jQuery("<option>")
            .attr("value", "")
            // [General]
            .text(browser.i18n.getMessage("settingsRulesProxyDefault"))
            .appendTo(cmdRuleProxyServer);

        let _dontIncludeAuthServers = false;
        if (environment.chrome)
            _dontIncludeAuthServers = true;

        if (proxyRule) {

            modalContainer.find("#chkRuleGeneratePattern").prop('checked', proxyRule.autoGeneratePattern);
            modalContainer.find("#cmdRuleType").val(proxyRule.ruleType);

            modalContainer.find("#txtRuleSource").val(proxyRule.sourceDomain);
            modalContainer.find("#txtRuleMatchPattern").val(proxyRule.rulePattern);
            modalContainer.find("#txtRuleUrlRegex").val(proxyRule.ruleRegex);
            modalContainer.find("#txtRuleUrlExact").val(proxyRule.ruleExact);
            modalContainer.find("#chkRuleEnabled").prop('checked', proxyRule.enabled);

            // let proxyServerName = null;
            // if (proxyRule.proxy)
            //     proxyServerName = proxyRule.proxy.name;

            //settingsPage.populateProxyServersToComboBox(cmdRuleProxyServer, proxyServerName, null, null, _dontIncludeAuthServers);

        } else {

            modalContainer.find("#chkRuleGeneratePattern").prop('checked', true);
            modalContainer.find("#cmdRuleType").val(ProxyRuleType.MatchPatternHost);

            modalContainer.find("#txtRuleSource").val("");
            modalContainer.find("#txtRuleMatchPattern").val("");
            modalContainer.find("#txtRuleUrlRegex").val("");
            modalContainer.find("#txtRuleUrlExact").val("");
            modalContainer.find("#chkRuleEnabled").prop('checked', true);

            //settingsPage.populateProxyServersToComboBox(cmdRuleProxyServer, null, null, null, _dontIncludeAuthServers);
        }

        settingsPage.updateProxyRuleModal();
    }

    private static updateProxyRuleModal() {
        let autoPattern = jQuery("#chkRuleGeneratePattern").prop('checked');
        if (autoPattern) {
            jQuery("#txtRuleMatchPattern").attr('disabled', 'disabled');
        }
        else {
            jQuery("#txtRuleMatchPattern").removeAttr('disabled');
        }

        let ruleType = jQuery("#cmdRuleType").val();

        if (ruleType == ProxyRuleType.MatchPatternHost ||
            ruleType == ProxyRuleType.MatchPatternUrl) {
            jQuery("#divRuleMatchPattern").show();
            jQuery("#divRuleGeneratePattern").show();
            jQuery("#divRuleUrlRegex").hide();
            jQuery("#divRuleUrlExact").hide();
        }
        else if (ruleType == ProxyRuleType.RegexHost ||
            ruleType == ProxyRuleType.RegexUrl) {
            jQuery("#divRuleMatchPattern").hide();
            jQuery("#divRuleGeneratePattern").hide();
            jQuery("#divRuleUrlRegex").show();
            jQuery("#divRuleUrlExact").hide();
        }
        else {
            jQuery("#divRuleMatchPattern").hide();
            jQuery("#divRuleGeneratePattern").hide();
            jQuery("#divRuleUrlRegex").hide();
            jQuery("#divRuleUrlExact").show();
        }
    }

    private static readProxyRuleModel(modalContainer: any): ProxyRule {
        let selectedProxyName = modalContainer.find("#cmdRuleProxyServer").val();
        let selectedProxy = null;

        
        let ruleInfo = new ProxyRule();
        ruleInfo.autoGeneratePattern = modalContainer.find("#chkRuleGeneratePattern").prop('checked');
        ruleInfo.ruleType = parseInt(modalContainer.find("#cmdRuleType").val());
        ruleInfo.sourceDomain = modalContainer.find("#txtRuleSource").val();
        ruleInfo.rulePattern = modalContainer.find("#txtRuleMatchPattern").val();
        ruleInfo.ruleRegex = modalContainer.find("#txtRuleUrlRegex").val();
        ruleInfo.ruleExact = modalContainer.find("#txtRuleUrlExact").val();
        ruleInfo.proxy = selectedProxy;
        ruleInfo.enabled = modalContainer.find("#chkRuleEnabled").prop("checked");
        return ruleInfo;
    }
    //#endregion

    //#region General tab functions --------------

    private static loadGeneralOptions(options: GeneralOptions) {
        if (!options)
            return;
        let divGeneral = jQuery("#tab-general");
        
        divGeneral.find('#mass-port')[0].value = options.MassPort;
        divGeneral.find('#tor-port')[0].value = options.TorPort;
        divGeneral.find('#counter-sel')[0].selectedIndex = options.country;
        
        // this is needed to enabled/disable syn check boxes based on settings
        //settingsPage.uiEvents.onSyncSettingsChanged();

        if (environment.chrome) {
            divGeneral.find("#chkProxyPerOrigin").attr("disabled", "disabled")
                .parents("label").attr("disabled", "disabled");
        }
    }

    private static readGeneralOptions(generalOptions?: GeneralOptions): GeneralOptions {
        if (!generalOptions)
            generalOptions = new GeneralOptions();
        let divGeneral = jQuery("#tab-general");

        generalOptions.MassPort = divGeneral.find('#mass-port')[0].value ;
        generalOptions.TorPort =  divGeneral.find('#tor-port')[0].value;
        generalOptions.country =  divGeneral.find('#counter-sel')[0].selectedIndex;
        return generalOptions;
    }

    //#endregion

    //#region Servers tab functions --------------


    // private static refreshServersGridRowElement(rowElement: any, invalidate?: boolean) {
    //     if (!rowElement)
    //         return;
    //     rowElement = jQuery(rowElement);

    //     rowElement.find("#btnServersRemove").on("click", settingsPage.uiEvents.onServersRemoveClick);
    //     rowElement.find("#btnServersEdit").on("click", settingsPage.uiEvents.onServersEditClick);
    // }



    /** find proxy from Servers or Subscriptions */
    
    //#endregion

    //#region Rules tab functions ------------------------------

    private static loadRules(rules: ProxyRule[]) {

        if (!this.grdRules)
            return;
        this.grdRules.clear();

        // prototype needed
        console.log(rules);
        let fixedRules = ProxyRule.assignArray(rules);
        console.log("MM", fixedRules);
        this.grdRules.rows.add(fixedRules).draw('full-hold');

        // binding the events for all the rows
        this.refreshRulesGridAllRows();
    }

    private static readRules(): any[] {
        return this.grdRules.data().toArray();
    }

    private static readSelectedRule(e?: any): any {
        let dataItem;

        if (e && e.target) {
            let rowElement = jQuery(e.target).parents('tr');
            if (rowElement.hasClass('child'))
                dataItem = this.grdRules.row({ selected: true }).data();
            else
                dataItem = this.grdRules.row(rowElement).data();
        }
        else
            dataItem = this.grdRules.row({ selected: true }).data();

        return dataItem;
    }

    private static readSelectedRuleRow(e: any): any {
        if (e && e.target) {
            let rowElement = jQuery(e.target).parents('tr');
            if (rowElement.hasClass('child'))
                return this.grdRules.row({ selected: true });
            else
                return this.grdRules.row(rowElement);
        }

        return null;
    }

    private static refreshRulesGrid() {
        let currentRow = this.grdRules.row('.selected');
        if (currentRow)
            // displaying the possible data change
            settingsPage.refreshRulesGridRow(currentRow, true);

        this.grdRules.draw('full-hold');
    }

    private static refreshRulesGridRow(row: any, invalidate?: any) {
        if (!row)
            return;
        if (invalidate)
            row.invalidate();

        let rowElement = jQuery(row.node());

        // NOTE: to display update data the row should be invalidated
        // and invalidated row loosed the event bindings.
        // so we need to bind the events each time data changes.

        rowElement.find("#btnRulesRemove").on("click", settingsPage.uiEvents.onRulesRemoveClick);
        rowElement.find("#btnRulesEdit").on("click", settingsPage.uiEvents.onRulesEditClick);
    }

    private static refreshRulesGridRowElement(rowElement: any) {
        if (!rowElement)
            return;

        rowElement = jQuery(rowElement);

        rowElement.find("#btnRulesRemove").on("click", settingsPage.uiEvents.onRulesRemoveClick);
        rowElement.find("#btnRulesEdit").on("click", settingsPage.uiEvents.onRulesEditClick);
    }

    private static refreshRulesGridAllRows() {
        var nodes = this.grdRules.rows().nodes();
        for (let index = 0; index < nodes.length; index++) {
            const rowElement = jQuery(nodes[index]);

            rowElement.find("#btnRulesRemove").on("click", settingsPage.uiEvents.onRulesRemoveClick);
            rowElement.find("#btnRulesEdit").on("click", settingsPage.uiEvents.onRulesEditClick);
        }
    }

    private static insertNewRuleInGrid(newRule: ProxyRule) {
        try {

            let row = this.grdRules.row
                .add(newRule)
                .draw('full-hold');

            // binding the events
            settingsPage.refreshRulesGridRow(row);

        } catch (error) {
            PolyFill.runtimeSendMessage("insertNewRuleInGrid failed! > " + error);
            throw error;
        }
    }

    private static insertNewRuleListInGrid(newRuleList: ProxyRule[]) {
        try {

            let lastRow;
            for (const rule of newRuleList) {
                lastRow = this.grdRules.row
                    .add(rule);
            }
            if (lastRow) {
                lastRow.draw('full-hold');

                // binding the events
                settingsPage.refreshRulesGridAllRows();
            }
        } catch (error) {
            PolyFill.runtimeSendMessage("insertNewRuleInGrid failed! > " + error);
            throw error;
        }
    }

    //#endregion

    //#region ServerSubscriptions tab functions --------------

    //#endregion

    //#region Events --------------------------
    private static uiEvents = {
        onClickSaveGeneralOptions() {
            let generalOptions = settingsPage.readGeneralOptions();

            PolyFill.runtimeSendMessage(
                {
                    command: Messages.SettingsPageSaveOptions,
                    options: generalOptions
                },
                (response: ResultHolder) => {
                    if (!response) return;
                    if (response.success) {
                        if (response.message)
                            messageBox.success(response.message);

                        settingsPage.currentSettings.options = generalOptions;
                        settingsPage.changeTracking.options = false;
                    } else {
                        if (response.message)
                            messageBox.error(response.message);
                    }
                },
                (error: Error) => {
                    messageBox.error(browser.i18n.getMessage("settingsErrorFailedToSaveGeneral") + " " + error.message);
                });
        },
        onClickRejectGeneralOptions() {
            // reset the data
            settingsPage.currentSettings.options = jQuery.extend({}, settingsPage.originalSettings.options);
            settingsPage.loadGeneralOptions(settingsPage.currentSettings.options);

            settingsPage.changeTracking.options = false;

            // Changes reverted successfully
            messageBox.info(browser.i18n.getMessage("settingsChangesReverted"));
        },
        onClickAddProxyMultipleRule() {
            let modal = jQuery("#modalAddMultipleRules");
            modal.data("editing", null);

            // update form
            modal.find("#cmdMultipleRuleType").val(0);
            modal.find("#txtMultipleRuleList").val("");

            modal.modal("show");
            modal.find("#txtMultipleRuleList").focus();
        },
        onClickSubmitMultipleRule() {
            let modal = jQuery("#modalAddMultipleRules");

            let ruleType = +modal.find("#cmdMultipleRuleType").val();
            let rulesStr = modal.find("#txtMultipleRuleList").val();

            let ruleList = rulesStr.split(/[\r\n]+/);
            let resultRuleList: ProxyRule[] = [];

            let existingRules = settingsPage.readRules();
            for (let ruleLine of ruleList) {
                if (!ruleLine)
                    continue;
                ruleLine = ruleLine.trim().toLowerCase();
                let domain: string;
                let newRule = new ProxyRule();

                if (ruleType == ProxyRuleType.Exact) {
                    if (!Utils.isValidUrl(ruleLine)) {
                        messageBox.error(
                            browser.i18n.getMessage("settingsRuleExactUrlInvalid").replace("{0}", ruleLine)
                        );
                        return;
                    }
                    newRule.ruleExact = ruleLine;
                    domain = Utils.extractHostFromUrl(ruleLine);
                }
                else if (ruleType == ProxyRuleType.MatchPatternHost) {

                    if (!Utils.urlHasSchema(ruleLine))
                        ruleLine = "http://" + ruleLine;

                    domain = Utils.extractHostFromUrl(ruleLine);

                    if (!Utils.isValidHost(domain)) {
                        messageBox.error(browser.i18n.getMessage("settingsMultipleRuleInvalidHost").replace("{0}", domain));
                        return;
                    }

                    domain = Utils.extractHostFromUrl(ruleLine);
                    newRule.rulePattern = Utils.hostToMatchPattern(domain, false);
                }
                else if (ruleType == ProxyRuleType.MatchPatternUrl) {

                    if (!Utils.isValidUrl(ruleLine)) {
                        messageBox.error(browser.i18n.getMessage("settingsRuleUrlInvalid"));
                        return;
                    }

                    domain = Utils.extractHostFromUrl(ruleLine);
                    newRule.rulePattern = Utils.hostToMatchPattern(ruleLine, true);
                }
                else {
                    // not supported
                    continue;
                }

                let ruleExists = existingRules.some(rule => {
                    return (rule.sourceDomain === domain);
                });

                if (ruleExists)
                    continue;

                newRule.autoGeneratePattern = true;
                newRule.enabled = true;
                newRule.proxy = null;
                newRule.sourceDomain = domain;
                newRule.ruleType = ruleType;

                resultRuleList.push(newRule);
            }

            if (!resultRuleList.length) {
                messageBox.error(browser.i18n.getMessage("settingsMultipleRuleNoNewRuleAdded"));
                return;
            }

            // insert to the grid
            settingsPage.insertNewRuleListInGrid(resultRuleList);

            settingsPage.changeTracking.rules = true;

            modal.modal("hide");
        },
        onClickAddProxyRule() {
            let modal = jQuery("#modalModifyRule");
            modal.data("editing", null);

            // update form
            settingsPage.populateRuleModal(modal, null);

            modal.modal("show");
            modal.find("#txtRuleSource").focus();
        },
        onChangeRuleGeneratePattern() {
            settingsPage.updateProxyRuleModal();
        },
        onChangeRuleType() {
            settingsPage.updateProxyRuleModal();
        },
        onClickSubmitProxyRule() {

            let modal = jQuery("#modalModifyRule");
            let editingModel = modal.data("editing");

            let ruleInfo = settingsPage.readProxyRuleModel(modal);

            let sourceDomain = ruleInfo.sourceDomain;
            if (!sourceDomain) {
                // Please specify the source of the rule!
                messageBox.error(browser.i18n.getMessage("settingsRuleSourceRequired"));
                return;
            }

            if (!Utils.isValidHost(sourceDomain)) {
                // source is invalid, source name should be something like 'google.com'
                messageBox.error(browser.i18n.getMessage("settingsRuleSourceInvalid"));
                return;
            }

            if (Utils.urlHasSchema(sourceDomain)) {
                let extractedHost = Utils.extractHostFromUrl(sourceDomain);
                if (extractedHost == null || !Utils.isValidHost(extractedHost)) {

                    // `Host name '${extractedHost}' is invalid, host name should be something like 'google.com'`
                    messageBox.error(
                        browser.i18n.getMessage("settingsRuleHostInvalid")
                            .replace("{0}", extractedHost)
                    );
                    return;
                }
                sourceDomain = extractedHost;

            } else {
                // this extraction is to remove paths from rules, e.g. google.com/test/

                let extractedHost = Utils.extractHostFromUrl("http://" + sourceDomain);
                if (extractedHost == null || !Utils.isValidHost(extractedHost)) {

                    // `Host name '${extractedHost}' is invalid, host name should be something like 'google.com'`
                    messageBox.error(
                        browser.i18n.getMessage("settingsRuleHostInvalid")
                            .replace("{0}", extractedHost)
                    );
                    return;
                }
            }
            ruleInfo.sourceDomain = sourceDomain;

            if (ruleInfo.ruleType == ProxyRuleType.MatchPatternHost) {

                if (ruleInfo.autoGeneratePattern) {
                    // Feature #41 Allow entering/modifying custom pattern for rules 
                    ruleInfo.rulePattern = Utils.hostToMatchPattern(sourceDomain, false);
                }
                else if (!ruleInfo.rulePattern.includes(sourceDomain)) {
                    // The rule does not match the source domain '{0}'
                    messageBox.error(
                        browser.i18n.getMessage("settingsRuleDoesntIncludeDomain").replace("{0}", sourceDomain)
                    );
                    return;
                }
            }
            else if (ruleInfo.ruleType == ProxyRuleType.MatchPatternUrl) {

                if (ruleInfo.autoGeneratePattern) {
                    // Feature #41 Allow entering/modifying custom pattern for rules 
                    ruleInfo.rulePattern = Utils.hostToMatchPattern(sourceDomain, true);
                }
                else if (!ruleInfo.rulePattern.includes(sourceDomain)) {
                    // The rule does not match the source domain '{0}'
                    messageBox.error(
                        browser.i18n.getMessage("settingsRuleDoesntIncludeDomain").replace("{0}", sourceDomain)
                    );
                    return;
                }
            }
            else if (ruleInfo.ruleType == ProxyRuleType.RegexHost) {

                try {

                    let regex = new RegExp(ruleInfo.ruleRegex);

                    if (!regex.test(sourceDomain)) {
                        // Regex rule does not match the source domain '{0}'
                        messageBox.error(
                            browser.i18n.getMessage("settingsRuleRegexNotMatchDomain").replace("{0}", sourceDomain)
                        );
                        return;
                    }

                } catch (error) {
                    // Regex rule '{0}' is not valid
                    messageBox.error(
                        browser.i18n.getMessage("settingsRuleRegexInvalid").replace("{0}", ruleInfo.ruleRegex)
                    );
                    return;
                }
            }
            else if (ruleInfo.ruleType == ProxyRuleType.RegexUrl) {

                try {

                    let regex = new RegExp(ruleInfo.ruleRegex);

                    if (!regex.test(sourceDomain)) {
                        // Regex rule does not match the source domain '{0}'
                        messageBox.error(
                            browser.i18n.getMessage("settingsRuleRegexNotMatchDomain").replace("{0}", sourceDomain)
                        );
                        return;
                    }

                } catch (error) {
                    // Regex rule '{0}' is not valid
                    messageBox.error(
                        browser.i18n.getMessage("settingsRuleRegexInvalid").replace("{0}", ruleInfo.ruleRegex)
                    );
                    return;
                }
            }
            else {
                if (!Utils.isValidUrl(ruleInfo.ruleExact)) {
                    messageBox.error(
                        browser.i18n.getMessage("settingsRuleExactUrlInvalid").replace("{0}", ruleInfo.ruleExact)
                    );
                    return;
                }
            }

            // ------------------
            let editingSource: string = null;
            if (editingModel)
                editingSource = editingModel.sourceDomain;

            let existingRules = settingsPage.readRules();
            let ruleExists = existingRules.some(rule => {
                return (rule.sourceDomain === sourceDomain && rule.sourceDomain != editingSource);
            });
            if (ruleExists) {
                // A Rule with the same source already exists!
                messageBox.error(browser.i18n.getMessage("settingsRuleSourceAlreadyExists"));
                return;
            }

            if (editingModel) {
                jQuery.extend(editingModel, ruleInfo);

                settingsPage.refreshRulesGrid();

            } else {

                // insert to the grid
                settingsPage.insertNewRuleInGrid(ruleInfo);
            }

            settingsPage.changeTracking.rules = true;

            modal.modal("hide");
        },
        onRulesEditClick(e: any) {
            let item = settingsPage.readSelectedRule(e);
            if (!item)
                return;

            let modal = jQuery("#modalModifyRule");
            modal.data("editing", item);

            settingsPage.populateRuleModal(modal, item);

            modal.modal("show");
            modal.find("#txtRuleSource").focus();
        },
        onRulesRemoveClick(e: any) {
            var row = settingsPage.readSelectedRuleRow(e);
            if (!row)
                return;

            messageBox.confirm(browser.i18n.getMessage("settingsConfirmRemoveProxyRule"),
                () => {

                    // remove then redraw the grid page
                    row.remove().draw('full-hold');

                    settingsPage.changeTracking.rules = true;
                });
        },
        onClickSaveProxyRules() {

            let rules = settingsPage.readRules();

            PolyFill.runtimeSendMessage(
                {
                    command: Messages.SettingsPageSaveProxyRules,
                    proxyRules: rules
                },
                (response: ResultHolder) => {
                    if (!response) return;
                    if (response.success) {
                        if (response.message)
                            messageBox.success(response.message);

                        // current rules should become equal to saved rules
                        settingsPage.currentSettings.proxyRules = rules;

                        settingsPage.changeTracking.rules = false;

                    } else {
                        if (response.message)
                            messageBox.error(response.message);
                    }
                },
                (error: Error) => {
                    messageBox.error(browser.i18n.getMessage("settingsErrorFailedToSaveRules") + " " + error.message);
                });
        },
        onClickRejectProxyRules() {
            // reset the data
            settingsPage.currentSettings.proxyRules = settingsPage.originalSettings.proxyRules.slice();
            settingsPage.loadRules(settingsPage.currentSettings.proxyRules);
            settingsPage.refreshRulesGrid();

            settingsPage.changeTracking.rules = false;

            // Changes reverted successfully
            messageBox.info(browser.i18n.getMessage("settingsChangesReverted"));
        },
        onClickClearProxyRules() {
            // Are you sure to remove all the rules?
            messageBox.confirm(browser.i18n.getMessage("settingsRemoveAllRules"),
                () => {
                    settingsPage.loadRules([]);

                    settingsPage.changeTracking.rules = true;

                    // All rules are removed.<br/>You have to save to apply the changes.
                    messageBox.info(browser.i18n.getMessage("settingsRemoveAllRulesSuccess"));
                });
        },
    };

    //#endregion

    //#region Common functions ---------------

    //#endregion

}
console.log("I AM HERERE");
settingsPage.initialize();