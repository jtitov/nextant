/**
 * Nextcloud - nextant
 * 
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 * 
 * @author Maxence Lange <maxence@pontapreta.net>
 * @copyright Maxence Lange 2016
 * @license GNU AGPL version 3 or any later version
 * 
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * 
 */

$(document)
		.ready(
				function() {

					$('html').keydown(function(e) {
						if (!nextantCurrentFocus)
							return;
						if (e.which == 13)
							return nextant_share_link.search(true);
					});

					$(window).resize(function() {
						nextant_share_link.suggestShow();
					});

					var nextantCurrentSearch = '';
					var nextantSearchDelayTimer = null;
					var nextantSearchDisplayed = false;
					var nextantCurrentFocus = false;
					var nextantSuggestDelayTimer = null;
					var nextantSuggestNoSpam = false;
					var nextantSuggestSelected = 0;
					var nextantSuggestResults = null;

					var nextant_share_link = {

						init : function() {

							$searchbox = '<form class="searchbox" action="#" method="post" role="search" novalidate="" style="padding-right: 300px;">';
							$searchbox += ' <label for="linksearchbox" class="hidden-visually">Search</label>';
							$searchbox += ' <input id="linksearchbox" name="query" value="" required="" autocomplete="off" tabindex="5" type="search">';
							$searchbox += '</form>';

							$('#logo-claim').after($searchbox);
							setTimeout(function() {
								$('#linksearchbox').fadeIn(500);
							}, 1000);

							$('#linksearchbox').on('input', function(e) {
								nextant_share_link.searchTimer();
								nextant_share_link.suggestTimer();
							});

							$('DIV.crumb.svg.last').live('click', function() {
								$('#linksearchbox').val('');
								nextant_share_link.search();
							});
							$('DIV.crumb.svg.ui-droppable').live('click',
									function() {
										$('#linksearchbox').val('');
										nextant_share_link.search();
									});

							$('#linksearchbox').focusout(function() {
								nextantCurrentFocus = false;
								nextant_share_link.suggestShow();
							});

							$('#linksearchbox').focusin(function() {
								nextantCurrentFocus = true;
								nextant_share_link.suggestShow();
							});

						},

						searchTimer : function() {
							if (nextantSearchDelayTimer != null)
								clearTimeout(nextantSearchDelayTimer);

							nextantSearchDelayTimer = setTimeout(function() {
								nextant_share_link.search(false);
							}, 250);
						},

						suggestTimer : function() {
							if (nextantSuggestDelayTimer != null)
								clearTimeout(nextantSuggestDelayTimer);

							nextantSuggestDelayTimer = setTimeout(function() {
								nextant_share_link.suggest();
							}, 50);
						},

						search : function(force) {
							nextantSearchDelayTimer = null;

							var query = $('#linksearchbox').val();
							if (!force && query == nextantCurrentSearch)
								return;

							if (query == '') {
								if (nextantSearchDisplayed) {
									$('#fileList').html(nextantCurrentFileList);
									$('tfoot').html(nextantCurrentTFoot);
									$('A.action').attr('style',
											'display : none !important');
									nextantSearchDisplayed = false;
								}
								return;
							}
							nextantCurrentSearch = query;

							var data = {
								query : query,
								key : nextant_share_link.getKey()
							}

							nextant_share_link.searchRequest(data);
						},

						searchRequest : function(data) {
							$.post(OC.filePath('nextant', 'ajax',
									'search_sharelink.php'), data,
									nextant_share_link.searchResult);
						},

						searchResult : function(response) {
							if (response == null)
								return;

							if (!nextantSearchDisplayed) {
								nextantCurrentFileList = $('#fileList').html();
								nextantCurrentTFoot = $('tfoot').html();
								nextantSearchDisplayed = true;
							}

							$('#fileList').empty();
							$('tfoot').empty();

							if (!$('#nextantList').length)
								$('#fileList')
										.append(
												'<tr><td colspan="3" style="margin: 0px; padding: 0px;"><div id="nextantList"></div></td></tr>');

							$('#nextantList').empty();

							response
									.forEach(function(entry) {

										var link = parent.location.protocol
												+ '//' + location.host
												+ OC.generateUrl('/s/')
												+ entry.sharelink_token;
										link += '/download?path='
												+ entry.dirpath + '&files='
												+ entry.filename;

										var row = nextant_share_link
												.template_entry()
												.replace(/%ID%/gi, entry.id)
												.replace(/%TYPE%/gi, entry.type)
												.replace(/%TITLE%/gi,
														entry.title)
												.replace(/%LINKMAIN%/gi, link)
												.replace(/%FILENAME%/gi,
														entry.filename)
												.replace(/%DIRPATH%/gi,
														entry.dirpath)
												.replace(/%SIZE%/gi, entry.size)
												.replace(/%SIZEREAD%/gi,
														entry.size_readable)
												.replace(/%MIMETYPE%/gi,
														entry.mimetype)
												.replace(/%ICON%/gi, entry.icon)
												.replace(/%MTIME%/gi,
														entry.mtime).replace(
														/%HIGHLIGHT1%/gi,
														entry.highlight1)
												.replace(/%HIGHLIGHT2%/gi,
														entry.highlight2);

										row = row
												.replace(
														/%SHARED%/gi,
														(entry.shared != '') ? ' style="background-image:url('
																+ entry.shared
																+ ');"'
																: '');
										row = row
												.replace(
														/%DELETED%/gi,
														(entry.deleted != '') ? ' style="background-image:url('
																+ entry.deleted
																+ ');"'
																: '');

										$('#nextantList').append(row);
									});
						},

						template_entry : function() {

							$tmpl = '<tr data-id="%ID%" data-type="%TYPE%" data-size="%SIZE%" data-file="%FILENAME%" data-mime="%MIMETYPE%" data-mtime="%MTIME%000" data-etag="" ';
							$tmpl += ' data-permissions="" data-has-preview="false" data-path="%PATH%" data-share-permissions="">';
							$tmpl += '<td class="filename ui-draggable">';
							$tmpl += '<a class="action action-favorite " data-original-title="" title="">';
							$tmpl += '</a>';
							$tmpl += '<label for="select-files-%ID%"><div class="thumbnail" style="background-image:url(%ICON%); background-size: 32px;">';
							$tmpl += '<div class="nextant_details" %DELETED%%SHARED%></div>';
							$tmpl += '</div>';
							$tmpl += '<span class="hidden-visually">Select</span></label>';

							$tmpl += '<a class="nextant_file" href="%LINKMAIN%">';
							$tmpl += '<div>';
							$tmpl += '<span class="nextant_line nextant_line1">%TITLE%</span>';
							$tmpl += '<span class="nextant_line nextant_line2">%HIGHLIGHT1%</span>';
							$tmpl += '<span class="nextant_line nextant_line3">%HIGHLIGHT2%</span>';
							$tmpl += '</div></a>';
							$tmpl += '</td>';
							$tmpl += '<td class="filesize" style="color:rgb(-17,-17,-17)">%SIZEREAD%</td>';
							$tmpl += '<td class="date"><span class="modified" title="" style="color:rgb(155,155,155)" data-original-title=""></span></td></tr>';

							return $tmpl;

						},

						suggest : function() {
							nextantSuggestDelayTimer = null;
							var query = $('#linksearchbox').val();
							var data = {
								query : query
							}
							nextant_share_link.suggestRequest(data);
						},

						suggestRequest : function(data) {
							if (nextantSuggestNoSpam)
								return;
							$.post(OC.filePath('nextant', 'ajax',
									'suggest_sharelink.php'), data,
									nextant_share_link.suggestResult);
						},

						suggestResult : function(response) {

							if (response == null || response.status > 0
									|| response.result.length == 0) {

								if (response.status > 0) {
									nextantSuggestNoSpam = true;
									setTimeout(function() {
										nextantSuggestNoSpam = false;
									}, 60000);
								}
								if ($('#nextantSugg_list').length)
									$('#nextantSugg_list').hide(200);
								return;
							}

							if (!$('#nextantSugg_list').length)
								$('#body-public').append(
										'<div id="nextantSugg_list"></div>');

							nextant_share_link.suggestShow();

							$('#nextantSugg_list').empty();

							var result = response.result;
							nextantSuggestResult = result;
							for (var i = 0; i < result.length; i++) {
								var first = '';
								if (i == 0)
									first = 'nextantSugg_firstitem';

								$('#nextantSugg_list').append(
										'<div id="nextant_sugg_' + i
												+ '" class="nextantSugg_item '
												+ first + '">'
												+ result[i].suggestion
												+ '</div>');
							}

							$('.nextantSugg_item').click(
									function() {
										nextant_share_link.suggestReplace($(
												this).text());
										nextant_share_link.search();
									});

						},

						suggestShow : function() {

							var offset = $('#linksearchbox').offset();
							var height = $('#linksearchbox').height();
							var top = offset.top + height + "px";
							var left = offset.left + "px";

							$('#nextantSugg_list').css({
								'position' : 'absolute',
								'left' : left,
								'top' : top
							});

							if (!$('#nextantSugg_list').length)
								return;
							if (nextantCurrentFocus)
								$('#nextantSugg_list').show(200);
							else
								$('#nextantSugg_list').hide(200);
						},

						suggestReplace : function(txt) {
							$('#linksearchbox').val(txt + ' ');
							$('#linksearchbox').focus();
						},

						getKey : function() {
							dir = window.location.href.split('/');
							key = dir[dir.length - 1];
							return key;
						}

					}

					nextant_share_link.init();

				});