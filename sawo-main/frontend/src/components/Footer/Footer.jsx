/* eslint-disable jsx-a11y/anchor-is-valid */
import sLogo from "../../assets/SAWO-logo.webp";

export default function Footer() {
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
            <h3 className="font-bold text-lg mb-2">FINNISH SAUNA</h3>
            <ul className="space-y-1 text-sm">
              <li><a href="#" className="hover:text-gray-300">Sauna Heaters</a></li>
              <li><a href="#" className="hover:text-gray-300">Sauna Controls</a></li>
              <li><a href="#" className="hover:text-gray-300">Sauna Accessories</a></li>
              <li><a href="#" className="hover:text-gray-300">Sauna Rooms</a></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col items-center sm:items-start border-b border-white lg:border-b-0 lg:border-r lg:border-white pb-4 lg:pb-0">
            <h3 className="font-bold text-lg mb-2">STEAM ROOM</h3>
            <ul className="space-y-1 text-sm">
              <li><a href="#" className="hover:text-gray-300">Steam Generators</a></li>
              <li><a href="#" className="hover:text-gray-300">Steam Controls</a></li>
              <li><a href="#" className="hover:text-gray-300">Steam Accessories</a></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col items-center sm:items-start border-b border-white lg:border-b-0 lg:border-r lg:border-white pb-4 lg:pb-0">
            <h3 className="font-bold text-lg mb-2">INFRARED SAUNA</h3>
            <ul className="space-y-1 text-sm">
              <li><a href="#" className="hover:text-gray-300">Infrared Sauna Rooms</a></li>
              <li><a href="#" className="hover:text-gray-300">Infrared Backrest</a></li>
              <li><a href="#" className="hover:text-gray-300">Infrared Panels</a></li>
            </ul>
          </div>

          {/* Column 4 - Social Media */}
          <div className="flex flex-col items-center text-center">
            <img src={sLogo} alt="SAWO" className="h-20 w-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Follow Us</h3>
            <div className="flex flex-wrap justify-center gap-4 text-xl">
              <a href="#" className="hover:text-gray-300"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="hover:text-gray-300"><i className="fab fa-instagram"></i></a>
              <a href="#" className="hover:text-gray-300"><i className="fab fa-linkedin-in"></i></a>
              <a href="#" className="hover:text-gray-300"><i className="fab fa-youtube"></i></a>
              <a href="#" className="hover:text-gray-300"><i className="fab fa-tiktok"></i></a>
              <a href="#" className="hover:text-gray-300"><i className="fas fa-envelope"></i></a>
              <a href="#" className="hover:text-gray-300"><i className="fas fa-phone"></i></a>
            </div>
          </div>
        </div>

        {/* Support & Download */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-5 text-center sm:text-left">
          <div>
            <h3 className="font-bold text-lg mb-2">SUPPORT</h3>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm leading-[.9]">
              <a href="#" className="hover:text-gray-300">Frequently Asked Questions</a>
              <a href="#" className="hover:text-gray-300">About Us</a>
              <a href="#" className="hover:text-gray-300">Contact Us</a>
              <a href="#" className="hover:text-gray-300">Careers</a>
              <a href="#" className="hover:text-gray-300">Privacy Policy</a>
              <a href="#" className="hover:text-gray-300">Sitemap</a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">DOWNLOAD</h3>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm">
              <a href="#" className="hover:text-gray-300">Product Catalogue</a>
              <a href="#" className="hover:text-gray-300">User Manuals</a>
            </div>
          </div>
        </div>

        {/* Technical Support */}
        <div className="py-5 border-b border-white flex flex-col items-center sm:flex-row sm:items-start gap-4 text-center sm:text-left">
          <i className="fas fa-headset text-xl"></i>
          <div>
            <h3 className="font-bold text-lg mb-2">TECHNICAL SUPPORT</h3>
            <p className="text-sm mb-2">For technical support and reclamations, please contact:</p>
            <p className="text-sm">Whatsapp: <a href="tel:+639497594450" className="hover:text-gray-300">+63 949 759 4450</a></p>
            <p className="text-sm"><a href="mailto:help@sawo.com" className="hover:text-gray-300">help@sawo.com</a></p>
          </div>
        </div>

        {/* Offices */}
        <div className="py-8">
          <h3 className="font-bold text-lg mb-6 text-center lg:text-left">OFFICES</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "fas fa-globe",
                title: "GLOBAL SALES & GENERAL INQUIRIES",
                company: "SAWO Inc.",
                address: ["Mactan Economic Zone 2, Mactan,", "Cebu 6015, Philippines"],
                tel: "+63 32 341 2233",
                email: "info@sawo.com",
              },
              {
                icon: "fas fa-warehouse",
                title: "SALES & WAREHOUSE FOR THE NORDICS",
                company: "SAWO Nordic Oy.",
                address: ["Hampuntie 18, 36220 Kangasala,", "Finland"],
                tel: "+358 40 038 3265",
                email: "finland@sawo.com",
              },
              {
                icon: "fas fa-warehouse",
                title: "SALES & WAREHOUSE FOR ASIA",
                company: "F.E.M. Ltd",
                address: ["2302, 23rd Floor, Cable TV Tower 9", "Hoi Shing Road, Tsuen Wan, Hong Kong"],
                tel: "+852 2417 1188",
                email: "hongkong@sawo.com",
              },
              {
                icon: "fas fa-warehouse",
                title: "SALES & WAREHOUSE FOR EUROPE",
                company: "SAWO EUROPE HUB",
                address: ["De Vest 24, 5555 XL Valkenswaard", "Netherlands"],
                tel: "+358 40 016 8269",
                email: "europehub@sawo.com",
              },
            ].map((office, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row gap-3 text-sm text-center sm:text-left items-center sm:items-start"
              >
                <i className={`${office.icon} text-xl mt-1 sm:mt-0`}></i>
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-1 leading-[1.3]">{office.title}</h4>
                  <p className="font-semibold">{office.company}</p>
                  {office.address.map((line, i) => <p key={i}>{line}</p>)}
                  <p>Tel: <a href={`tel:${office.tel}`} className="hover:text-gray-300">{office.tel}</a></p>
                  <p><a href={`mailto:${office.email}`} className="hover:text-gray-300">{office.email}</a></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-sm pt-6">
          <p>© 2026 All rights reserved. · SAWO</p>
        </div>
      </div>
    </footer>
  );
}
