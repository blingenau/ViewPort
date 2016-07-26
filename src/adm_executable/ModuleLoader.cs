using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Reflection;
using System.IO;
using Newtonsoft.Json;

namespace ModuleLoader
{
    class ModuleLoader
    {
        static dynamic moduleInstance;

        static void LoadModule(string moduleName)
        {
            try
            {
                System.Reflection.Assembly dll = System.Reflection.Assembly.LoadFile(moduleName);
                if (dll != null)
                {
                    Type type = dll.GetType("Apollo.Main");
                    if (type != null)
                    {
                        moduleInstance = Activator.CreateInstance(type);
                        moduleInstance.Instantiate();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex.Message);
                Console.Error.Flush();
            }
        }

        static string CallPrint(string labelURL, string JSONObjectText, bool useDefaultPrinter)
        {
            return moduleInstance.Print(labelURL, JSONObjectText, useDefaultPrinter);
        }

        static string CallIsSoftwareInstalled()
        {
            return Convert.ToString(moduleInstance.IsSoftwareInstalled());
        }

        static string CallGetDeviceStatus()
        {
            return moduleInstance.GetDeviceStatus();
        }

        static void Main(string[] args)
        {
            LoadModule(Directory.GetCurrentDirectory() + "\\src\\bin\\dymo\\DYMOLabelPrinter.dll");
            
            string line = null; //= "{\"Module\":\"DYMOLabelPrinter\",\"Action\":\"Print\",\"Callback\":\"PrintResponse\",\"Data\":\"{\\\"labelURL\\\":\\\"https://prodmirror.athenahealth.com/static_20160719_1468991381/singlelabel.label\\\",\\\"JSONObjectText\\\":\\\"{\\\\\\\"PT_NAME\\\\\\\":\\\\\\\"TEST, AARON #13760\\\\\\\\n\\\\\\\",\\\\\\\"PT_INFO\\\\\\\":\\\\\\\"dob: 05/02/2015 CARDIOLOGY\\\\\\\\n311 ARSENAL ST\\\\\\\\nBOSTON, GA 02127\\\\\\\\nh: (678) 862-8902  w: 6788628902\\\\\\\"}\\\",\\\"useDefaultPrinter\\\":false}\",\"MessageIdentifier\":\"cebbb314-d191-9a9f-071c-7998ac07f180\",\"ChunkNumber\":1,\"TotalChunks\":1,\"Checksum\":\"fa702d3e7580cb077afef734573effa9\"}";
            do
            {
                line = Console.ReadLine();
                try
                {
                    var input = JsonConvert.DeserializeObject<Dictionary<string, string>>(line);
                    string id = input["id"];
                    var command = JsonConvert.DeserializeObject<Dictionary<string, string>>(input["message"]);
                    Dictionary<string, string> response = new Dictionary<string, string>();
                    string dllResponse;
                    response.Add("id", id);
                    switch (command["Action"])
                    {
                        case "Print":
                            var data = JsonConvert.DeserializeObject<Dictionary<string, string>>(command["Data"]);
                            dllResponse = CallPrint(data["labelURL"], data["JSONObjectText"], Convert.ToBoolean(data["useDefaultPrinter"]));
                            if (dllResponse == "")
                            {
                                dllResponse = "null";
                            }
                            response.Add("response", dllResponse);)
                            Console.WriteLine(JsonConvert.SerializeObject(response));
                            Console.Out.Flush();
                            line = null;
                            break;
                        case "IsSoftwareInstalled":
                            dllResponse = CallIsSoftwareInstalled();
                            response.Add("response", dllResponse);
                            Console.WriteLine(JsonConvert.SerializeObject(response));
                            Console.Out.Flush();
                            line = null;
                            break;
                        case "Status":
                            dllResponse = CallGetDeviceStatus();
                            response.Add("response", dllResponse);
                            Console.WriteLine(JsonConvert.SerializeObject(response));
                            Console.Out.Flush();
                            line = null;
                            break;
                        default:
                            Console.WriteLine("Action not found");
                            Console.Out.Flush();
                            break;
                    }
                }
                catch (Exception e)
                {
                    Console.Error.WriteLine(e.Message + " - " + line);
                    Console.Error.Flush();
                }
            } while (line == null);
        }
    }
}
