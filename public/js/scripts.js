const slideBanner = function () {
	if($('#slideBanner').length > 0) {
		new Swiper('#slideBanner', {
			loop: false,
			simulateTouch: false,
			speed: 250,
			navigation: {
				nextEl: '#slideBanner .slide-button-next',
				prevEl: '#slideBanner .slide-button-prev',
			},
			autoplay: {
				delay: 10000,
				disableOnInteraction: false,
			},
			on: {
				init: function () {
					Waves.attach('#slideBanner .swiper-slide .btn');
				}
			}
		});
	}

	if($('#swiper-banner').length > 0) {
		new Swiper('#swiper-banner', {
			loop: false,
			simulateTouch: false,
			speed: 250,
			navigation: {
				nextEl: '#swiper-banner .swiper-button-next',
				prevEl: '#swiper-banner .swiper-button-prev',
			},
			autoplay: {
				delay: 10000,
				disableOnInteraction: false,
			},
		});
	}
}


const initRowCardChange = function () {
	let elm = $('#form-expandCard_Change');

	elm.on('click', '.deleteRow', function () {
		$(this).closest('.row').remove();
	});
}
const initRowCardTopUp = function () {
	let elm = $('#form-expandCard_TopUp');
	elm.find('.createRow').click(function () {
		html = `<div class="row row-10 mb-3 align-items-center">
								<div class="col-md-2">
									<div class="form-group">
										<input type="tel" minlength="10" maxlength="11" class="form-control" id="sdt"
											   placeholder="Số điện thoại">
									</div>
								</div>
								<div class="col-md-2">
									<div class="form-group">
										<select class="form-control" id="nhamang">
											<option name="-1">--- Nhà mạng ---</option>
											<option name="">Viettel trả trước</option>
											<option name="">Viettel trả sau / FTTH / Home</option>
											<option name="">Vina trả trước</option>
											<option name="">Vina trả sau</option>
											<option name="">Mobi trả trước</option>
											<option name="">Mobi trả sau</option>
											<option name="">Bắn TKC Viettel</option>
											<option name="">Bắn TKC Vina</option>
											<option name="">Bắn TKC Mobi</option>
										</select>
									</div>
								</div>
								<div class="col-md-2">
									<div class="form-group">
										<select class="form-control" id="price">
											<option name="-1">--- Mệnh giá ---</option>
											<option name="10000">10.000 đ</option>
											<option name="20000">20.000 đ</option>
											<option name="30000">30.000 đ</option>
											<option name="50000">50.000 đ</option>
											<option name="100000">100.000 đ</option>
											<option name="200000">200.000 đ</option>
											<option name="300000">300.000 đ</option>
											<option name="500000">500.000 đ</option>
											<option name="1000000">1.000.000 đ</option>
										</select>
									</div>
								</div>
								<div class="col-md-2">
									<div class="form-group">
										<input type="text" class="form-control" id="chietkhau" placeholder="Chiết khấu"
											   readonly>
									</div>
								</div>
								<div class="col-md-3 col-9">
									<div class="form-group">
										<input type="text" class="form-control" id="ghichu" placeholder="Ghi chú">
									</div>
								</div>
								<div class=" col-md-1 col-3">
									<a href="javascript:void(0)"
									   class="createRow btn-create_row btn btn-success btn-sm waves-light waves-effect">
										<i class="fas fa-plus"></i>
										Thêm
									</a>
								</div>
							</div>`;
		$('#form-expandCard_TopUp').append(html)
	});

	elm.on('click', '.deleteRow', function () {
		$(this).closest('.row').remove();
	});
}

const changeTabCard = function (e) {
	$('.card-change[data-toggle=tab]').on('shown.bs.tab', function () {
		$('.card-change[data-toggle=tab]').removeClass('active');
		$(this).addClass('active');
		$(this).parent().addClass('active');
	});
}

let windowWidth = $(window).width();
const scrollCartShoppingMobile = function () {
	if (windowWidth < 768 && $('#shopping-cart-wrapper').length > 0) {
		$(window).scroll(function () {
			let top = $(document).scrollTop();
			let heightCart = $('#shopping-cart-wrapper').offset().top - $('#shopping-cart-wrapper').innerHeight();

			if (top >= heightCart) {
				$('.fixedCart').removeClass('show');
			} else {
				$('.fixedCart').addClass('show');
			}
		});
	}

	$('.scrollCart').click(function (e) {
		$('body').animate({
			'scrollTop': $('#shopping-cart-wrapper').offset().top - 60
		}, 250)
	});
}

const handleTouchMove = function (ev) {
	ev.preventDefault();
}

const navigationMobile = function (e) {
	if (windowWidth < 992) {
		$("#header .header-inner .header-inner_nav > ul > li > ul").each(function (index) {
			$(this).prev().attr({
				"href": "#subMenuTopUp" + index,
				"data-toggle": "collapse"
			});
			$(this).attr({
				"id": "subMenuTopUp" + index,
				"class": "collapse list-unstyled mb-0",
				"data-parent": "#hasMenuTopUp"
			});
		})

		/*
		 * Call menu mobile
		 */
		let body = $('body'),
			hamburgerIcon = $('#call-header_mobile');

		hamburgerIcon.click(function (e) {
			if (!body.hasClass('is-show_navigation')) {
				body.attr({
					'class': 'is-show_navigation',
					'style': 'overflow-y: hidden'
				});
				document.addEventListener('touchmove', handleTouchMove, {passive: false});
				$('#user-mobile').removeClass('active');
			} else {
				body.attr({
					'class': '',
					'style': ''
				});
				document.removeEventListener('touchmove', handleTouchMove);
			}
		});
	}
}

const callUserMobile = function () {
	$('#call-user_mobile, #header-overlay').click(function () {
		$(this).parent().toggleClass('active');
		$('body').attr({
			'class': '',
			'style': ''
		});
		document.removeEventListener('touchmove', handleTouchMove);
	});

	$(document).mouseup(function (e) {
		let elm = $('#user-mobile');
		elm.is(e.target) || 0 !== elm.has(e.target).length || (
			elm.removeClass('active')
		)
	})
}

const headerScroll = function () {
	let body = document.body,
		html = document.documentElement,
		height = Math.max(body.scrollHeight, body.offsetHeight,
			html.clientHeight, html.scrollHeight, html.offsetHeight);
	$(window).scroll(function () {
		if ($(document).scrollTop() > $('#header').innerHeight()) {
			$('#header').addClass('is-scroll').removeClass('is-scrolled');
		} else {
			if (height > screen.height + $('#header').height() || $(document).scrollTop() == 0) {
				$('#header').removeClass('is-scroll').addClass('is-scrolled');
			}
		}
	});
}


$(function () {
	Waves.init();
	slideBanner();
	headerScroll();
	initRowCardChange();
	initRowCardTopUp();
	changeTabCard();
	scrollCartShoppingMobile();
	navigationMobile();
	callUserMobile();
});