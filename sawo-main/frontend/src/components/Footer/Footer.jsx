/* eslint-disable jsx-a11y/anchor-is-valid */
import { Link } from "react-router-dom";
import sLogo from "../../assets/SAWO-logo.webp";
import menuPaths from "../../menuPaths";
import { useLocaleT, useLocalizedPath } from "../../i18n/LocaleContext";

export default function Footer() {
  const t = useLocaleT("footer");
  const localize = useLocalizedPath();

  return (
    <footer
      className="bg-[#1a1a1a] text-white py-12"
      style={{ fontFamily: "Montserrat, sans-serif" }}
    >
      <div className="max-w-screen-2xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-4 text-center sm:text-left">
          {/* Column 1 */}
          <div className="flex flex-col items-center sm:items-start border-b border-white lg:border-b-0 lg:border-r lg:border-white pb-4 lg:pb-0">
            <h3 className="font-bold text-lg mb-2">{t("headings.finnishSauna")}</h3>
            <ul className="space-y-1 text-sm">
              <li><Link to={localize(menuPaths.sauna.heaters.parent)} className="hover:text-gray-300">{t("links.saunaHeaters")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.controls)} className="hover:text-gray-300">{t("links.saunaControls")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.accessories.parent)} className="hover:text-gray-300">{t("links.saunaAccessories")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.rooms)} className="hover:text-gray-300">{t("links.saunaRooms")}</Link></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col items-center sm:items-start border-b border-white lg:border-b-0 lg:border-r lg:border-white pb-4 lg:pb-0">
            <h3 className="font-bold text-lg mb-2">{t("headings.steamRoom")}</h3>
            <ul className="space-y-1 text-sm">
              <li><Link to={localize(menuPaths.steam.generators)} className="hover:text-gray-300">{t("links.steamGenerators")}</Link></li>
              <li><Link to={localize(menuPaths.steam.controls)} className="hover:text-gray-300">{t("links.steamControls")}</Link></li>
              <li><Link to={localize(menuPaths.steam.accessories)} className="hover:text-gray-300">{t("links.steamAccessories")}</Link></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col items-center sm:items-start border-b border-white lg:border-b-0 lg:border-r lg:border-white pb-4 lg:pb-0">
            <h3 className="font-bold text-lg mb-2">{t("headings.infraredSauna")}</h3>
            <ul className="space-y-1 text-sm">
              <li><Link to={localize(menuPaths.infrared.room)} className="hover:text-gray-300">{t("links.infraredRooms")}</Link></li>
              <li><Link to={localize("/products/infrared-backrest")} className="hover:text-gray-300">{t("links.infraredBackrest")}</Link></li>
              <li><Link to={localize("/products/infrared-panels")} className="hover:text-gray-300">{t("links.infraredPanels")}</Link></li>
            </ul>
          </div>

          {/* Column 4 - Social Media */}
          <div className="flex flex-col items-center text-center">
            <img src={sLogo} alt="SAWO" width="400" height="255" className="h-20 w-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">{t("headings.followUs")}</h3>
            {/* w-9/h-9 keeps each icon close to a 44px touch target while sitting tighter together */}
            <div className="flex flex-wrap justify-center gap-1 text-xl">
              <a href="http://facebook.com/SAWOsaunaworld" target="_blank" rel="noopener noreferrer" aria-label={t("social.facebook")} className="hover:text-gray-300 inline-flex items-center justify-center w-9 h-9"><i className="fab fa-facebook-f" aria-hidden="true"></i></a>
              <a href="https://www.instagram.com/sawosauna/" target="_blank" rel="noopener noreferrer" aria-label={t("social.instagram")} className="hover:text-gray-300 inline-flex items-center justify-center w-9 h-9"><i className="fab fa-instagram" aria-hidden="true"></i></a>
              <a href="https://ph.linkedin.com/company/sawo-inc" target="_blank" rel="noopener noreferrer" aria-label={t("social.linkedin")} className="hover:text-gray-300 inline-flex items-center justify-center w-9 h-9"><i className="fab fa-linkedin-in" aria-hidden="true"></i></a>
              <a href="https://www.youtube.com/@SAWOsauna" target="_blank" rel="noopener noreferrer" aria-label={t("social.youtube")} className="hover:text-gray-300 inline-flex items-center justify-center w-9 h-9"><i className="fab fa-youtube" aria-hidden="true"></i></a>
              <a href="https://www.tiktok.com/@sawosauna" target="_blank" rel="noopener noreferrer" aria-label={t("social.tiktok")} className="hover:text-gray-300 inline-flex items-center justify-center w-9 h-9"><i className="fab fa-tiktok" aria-hidden="true"></i></a>
              <a href="mailto:help@sawo.com" aria-label={t("social.email")} className="hover:text-gray-300 inline-flex items-center justify-center w-9 h-9"><i className="fas fa-envelope" aria-hidden="true"></i></a>
              <a href="tel:+63323412233" aria-label={t("social.phone")} className="hover:text-gray-300 inline-flex items-center justify-center w-9 h-9"><i className="fas fa-phone" aria-hidden="true"></i></a>
            </div>
          </div>
        </div>

        {/* Support & Download */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-5 text-center sm:text-left">
          <div>
            <h3 className="font-bold text-lg mb-2">{t("headings.support")}</h3>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm leading-[.9]">
              <Link to={localize(menuPaths.support.faq)} className="hover:text-gray-300">{t("links.faq")}</Link>
              <Link to={localize(menuPaths.about.parent)} className="hover:text-gray-300">{t("links.aboutUs")}</Link>
              <Link to={localize(menuPaths.contact)} className="hover:text-gray-300">{t("links.contactUs")}</Link>
              <Link to={localize(menuPaths.careers)} className="hover:text-gray-300">{t("links.careers")}</Link>
              <Link to={localize(menuPaths.privacy)} className="hover:text-gray-300">{t("links.privacyPolicy")}</Link>
              <Link to={localize(menuPaths.sitemap)} className="hover:text-gray-300">{t("links.sitemap")}</Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">{t("headings.download")}</h3>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm">
              <Link to={localize(menuPaths.support.catalogue)} className="hover:text-gray-300">{t("links.productCatalogue")}</Link>
              <Link to={localize(menuPaths.support.manuals)} className="hover:text-gray-300">{t("links.userManuals")}</Link>
            </div>
          </div>
        </div>

        {/* Technical Support */}
        <div className="py-5 border-b border-white flex flex-col items-center sm:flex-row sm:items-start gap-4 text-center sm:text-left">
          <i className="fas fa-headset text-xl"></i>
          <div>
            <h3 className="font-bold text-lg mb-2">{t("headings.technicalSupport")}</h3>
            <p className="text-sm mb-2">{t("technicalSupportIntro")}</p>
            <p className="text-sm">{t("whatsapp")}: <a href="tel:+639497594450" className="hover:text-gray-300 inline-block py-1.5">+63 949 759 4450</a></p>
            <p className="text-sm"><a href="mailto:help@sawo.com" className="hover:text-gray-300 inline-block py-1.5">help@sawo.com</a></p>
          </div>
        </div>

        {/* Offices */}
        <div className="py-8">
          <h3 className="font-bold text-lg mb-6 text-center lg:text-left">{t("headings.offices")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "fas fa-globe",
                titleKey: "global",
                company: "SAWO Inc.",
                address: ["Mactan Economic Zone 2, Mactan,", "Cebu 6015, Philippines"],
                tel: "+63 32 341 2233",
                email: "info@sawo.com",
                mapsLink: "https://www.google.com/maps/place/SAWO+Inc./@10.2908545,123.9474748,20678m/data=!3m1!1e3!4m6!3m5!1s0x33a999f9aaaaaaab:0x638e93b7abe9d209!8m2!3d10.3065109!4d123.9662661!16s%2Fg%2F11xbg6w1q?entry=ttu&g_ep=EgoyMDI2MDUxMi4wIKXMDSoASAFQAw%3D%3D",
              },
              {
                icon: "fas fa-warehouse",
                titleKey: "nordics",
                company: "SAWO Nordic Oy.",
                address: ["Hampuntie 18, 36220 Kangasala,", "Finland"],
                tel: "+358 40 038 3265",
                email: "finland@sawo.com",
                mapsLink: "https://www.google.com/maps/place/Sawo+Nordic+Oy/@61.4682459,23.8889861,40152m/data=!3m1!1e3!4m6!3m5!1s0x468f1ff184c90c83:0xe1681d5d0909096b!8m2!3d61.4996934!4d23.7501876!16s%2Fg%2F1q675ymsx?entry=ttu&g_ep=EgoyMDI2MDUxMi4wIKXMDSoASAFQAw%3D%3D",
              },
              {
                icon: "fas fa-warehouse",
                titleKey: "asia",
                company: "F.E.M. Ltd",
                address: ["2302, 23rd Floor, Cable TV Tower 9", "Hoi Shing Road, Tsuen Wan, Hong Kong"],
                tel: "+852 2417 1188",
                email: "hongkong@sawo.com",
                mapsLink: "https://www.google.com/maps/place/Cable+T+V+Tower,+9+Hoi+Shing+Rd,+Chai+Wan+Kok,+Hong+Kong/@22.3720256,114.1051012,1215m/data=!3m1!1e3!4m6!3m5!1s0x3403f8e56f3381c9:0xbdbb69dc3fa013e4!8m2!3d22.3727747!4d114.1073972!16s%2Fg%2F12j799c55?entry=ttu&g_ep=EgoyMDI2MDUxMi4wIKXMDSoASAFQAw%3D%3D",
              },
              {
                icon: "fas fa-warehouse",
                titleKey: "europe",
                company: "SAWO EUROPE HUB",
                address: ["De Vest 24, 5555 XL Valkenswaard", "Netherlands"],
                tel: "+358 40 016 8269",
                email: "europehub@sawo.com",
                mapsLink: "https://www.google.com/maps/place/SAWO+Sauna+Europe+B.V./@51.347626,5.4851098,820m/data=!3m2!1e3!4b1!4m6!3m5!1s0x47c6d7006fe0a9bb:0x95ddf180c98d0533!8m2!3d51.347626!4d5.4876847!16s%2Fg%2F11nbg5c2pp?entry=ttu&g_ep=EgoyMDI2MDUxMi4wIKXMDSoASAFQAw%3D%3D",
              },
            ].map((office, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row gap-3 text-sm text-center sm:text-left items-center sm:items-start"
              >
                <i className={`${office.icon} text-xl mt-1 sm:mt-0`}></i>
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-1 leading-[1.3]">{t(`offices.${office.titleKey}`)}</h4>
                  <a
                    href={office.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer block"
                  >
                    <p className="font-semibold">{office.company}</p>
                    {office.address.map((line, i) => <p key={i}>{line}</p>)}
                  </a>
                  <p>{t("tel")}: <a href={`tel:${office.tel}`} className="hover:text-gray-300 inline-block py-1.5">{office.tel}</a></p>
                  <p><a href={`mailto:${office.email}`} className="hover:text-gray-300 inline-block py-1.5">{office.email}</a></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-sm pt-6">
          <p>{t("copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
