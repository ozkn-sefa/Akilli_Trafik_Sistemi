using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using AkıllıTrafikSistemi.Models;
using System.Globalization;
using System.Linq;

namespace AkıllıTrafikSistemi.Controllers
{
    public class HomeController : Controller
    {
        private readonly HttpClient _http;

        public HomeController(IHttpClientFactory httpFactory)
        {
            _http = httpFactory.CreateClient();
        }

        public async Task<IActionResult> Index(double? lat, double? lon)
        {
            if (HttpContext.Session.GetString("Username") == null)
                return RedirectToAction("DefaultIndex");

            WeatherModel? model = null;

            if (lat.HasValue && lon.HasValue)
            {
                try
                {
                    string soapEnvelope = $@"
<soapenv:Envelope xmlns:soapenv=""http://schemas.xmlsoap.org/soap/envelope/"" 
              xmlns:wea=""http://example.com/weather"">
  <soapenv:Header/>
  <soapenv:Body>
    <wea:getWeatherByCoords>
      <lat>{lat.Value.ToString(CultureInfo.InvariantCulture)}</lat>
      <lon>{lon.Value.ToString(CultureInfo.InvariantCulture)}</lon>
    </wea:getWeatherByCoords>
  </soapenv:Body>
</soapenv:Envelope>";

                    var content = new StringContent(soapEnvelope, Encoding.UTF8, "text/xml");
                    var response = await _http.PostAsync("http://localhost:3001/wsdl", content);
                    var xmlResult = await response.Content.ReadAsStringAsync();

                    var doc = XDocument.Parse(xmlResult);
                    var data = doc.Descendants().FirstOrDefault(x => x.Name.LocalName == "weatherData");

                    if (data != null)
                    {
                        var city = data.Element(XName.Get("city"))?.Value;
                        var state = data.Element(XName.Get("state"))?.Value;
                        var district = data.Element(XName.Get("district"))?.Value;
                        var country = data.Element(XName.Get("country"))?.Value;

                        // Bölge stringi
                        string region = "";
                        if (!string.IsNullOrEmpty(district) && !string.IsNullOrEmpty(state))
                            region = $"{district}, {state}, {country}";
                        else if (!string.IsNullOrEmpty(city) && !string.IsNullOrEmpty(state))
                            region = $"{city}, {state}, {country}";
                        else if (!string.IsNullOrEmpty(city))
                            region = $"{city}, {country}";
                        else
                            region = country ?? "";

                        model = new WeatherModel
                        {
                            Weather = new WeatherData
                            {
                                Temperature = double.Parse(
                                    (data.Element(XName.Get("temperature"))?.Value ?? "0").Replace(",", "."),
                                    CultureInfo.InvariantCulture),
                                Windspeed = double.Parse(
                                    (data.Element(XName.Get("windspeed"))?.Value ?? "0").Replace(",", "."),
                                    CultureInfo.InvariantCulture),
                                Winddirection = int.Parse(data.Element(XName.Get("winddirection"))?.Value ?? "0"),
                                Time = data.Element(XName.Get("time"))?.Value,
                                Description = data.Element(XName.Get("description"))?.Value // Yeni Alan
                            },
                            Location = new LocationData
                            {
                                Country = country,
                                State = state,      // İl
                                Suburb = district,  // İlçe
                                City = city,
                                Road = region       // Bölge olarak gösterim
                            }
                        };
                    }
                }
                catch (System.Exception ex)
                {
                    Console.WriteLine("SOAP HATASI: " + ex.Message);
                }
            }

            return View(model);
        }

        public IActionResult DefaultIndex()
        {
            return View();
        }
    }
}