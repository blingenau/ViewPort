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
            LoadModule(Directory.GetCurrentDirectory() + @"\src\bin\dymo\DYMOLabelPrinter.dll");

            string line = null;
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
                            response.Add("response", dllResponse);
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
